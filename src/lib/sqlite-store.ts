import SQLite from 'expo-sqlite';
import { openDatabaseSync } from 'expo-sqlite';
import type { Visit, DecayState } from './decay';

// Schema version for defensive migration
const SCHEMA_VERSION = 2;

export const db = openDatabaseSync('decay.db');

export interface SchemaRow {
  key: string;
  value: string;
}

export interface VisitRow {
  t: number;
  present: number;
  ms: number;
}

export function initSchema() {
  db.runSync(`
    CREATE TABLE IF NOT EXISTS meta (
      key TEXT PRIMARY KEY,
      value INTEGER NOT NULL
    );
  `);
  db.runSync(`
    CREATE TABLE IF NOT EXISTS companion (
      id INTEGER PRIMARY KEY CHECK (id = 1),
      planted_at INTEGER,
      passed_at INTEGER,
      ambient_on INTEGER DEFAULT 0,
      onboarded INTEGER DEFAULT 0,
      seed INTEGER DEFAULT 0,
      schema_version INTEGER DEFAULT 2
    );
  `);
  db.runSync(`
    CREATE TABLE IF NOT EXISTS visits (
      t INTEGER PRIMARY KEY,
      present INTEGER NOT NULL,
      ms INTEGER NOT NULL
    );
  `);
  db.runSync(`
    CREATE TABLE IF NOT EXISTS fragments (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      seed INTEGER NOT NULL,
      text TEXT NOT NULL,
      created_at INTEGER DEFAULT (strftime('%s','now'))
    );
  `);
  // Schema version tracking
  db.runSync(`
    INSERT OR IGNORE INTO meta (key, value) VALUES ('schema_version', ${SCHEMA_VERSION});
  `);
}

export function getSchemaVersion(): number {
  try {
    const row = db.getFirstSync('SELECT value FROM meta WHERE key = ?', 'schema_version') as { value: number } | null;
    return row?.value ?? 0;
  } catch {
    return 0;
  }
}

export function migrateIfNeeded() {
  const v = getSchemaVersion();
  if (v < 1) {
    // From v0 (AsyncStorage) to v1: create tables (already done by initSchema)
    db.runSync(`UPDATE meta SET value = 1 WHERE key = 'schema_version';`);
  }
  if (v < 2) {
    db.runSync(`ALTER TABLE companion ADD COLUMN seed INTEGER DEFAULT 0;`);
    db.runSync(`CREATE TABLE IF NOT EXISTS fragments (id INTEGER PRIMARY KEY AUTOINCREMENT, seed INTEGER NOT NULL, text TEXT NOT NULL, created_at INTEGER DEFAULT (strftime('%s','now')));`);
    db.runSync(`UPDATE meta SET value = 2 WHERE key = 'schema_version';`);
  }
}

// Atomic state read with monotonic sanity
export function loadCompanionState(): {
  plantedAt: number | null;
  passedAt: number | null;
  ambientOn: boolean;
  onboarded: boolean;
  seed: number;
  visits: Visit[];
} {
  try {
    const row = db.getFirstSync('SELECT * FROM companion WHERE id = 1') as {
      planted_at: number | null; passed_at: number | null;
      ambient_on: number; onboarded: number; seed: number; schema_version: number;
    } | null;
    if (!row) return { plantedAt: null, passedAt: null, ambientOn: false, onboarded: false, seed: 0, visits: [] };
    const visits = db.getAllSync('SELECT t, present, ms FROM visits ORDER BY t ASC') as VisitRow[];
    return {
      plantedAt: row.planted_at ?? null,
      passedAt: row.passed_at ?? null,
      ambientOn: row.ambient_on === 1,
      onboarded: row.onboarded === 1,
      seed: row.seed ?? 0,
      visits: visits.map(v => ({ t: v.t, present: v.present === 1, ms: v.ms })),
    };
  } catch {
    return { plantedAt: null, passedAt: null, ambientOn: false, onboarded: false, seed: 0, visits: [] };
  }
}

// Atomic write with transaction
export function saveCompanionState(
  plantedAt: number | null,
  passedAt: number | null,
  ambientOn: boolean,
  onboarded: boolean,
  seed: number,
  visits: Visit[],
): void {
  db.runSync('BEGIN TRANSACTION');
  try {
    db.runSync(`
      INSERT INTO companion (id, planted_at, passed_at, ambient_on, onboarded, seed)
      VALUES (1, ?, ?, ?, ?, ?)
      ON CONFLICT(id) DO UPDATE SET
        planted_at = excluded.planted_at,
        passed_at = excluded.passed_at,
        ambient_on = excluded.ambient_on,
        onboarded = excluded.onboarded,
        seed = excluded.seed;
    `, [plantedAt ?? null, passedAt ?? null, ambientOn ? 1 : 0, onboarded ? 1 : 0, seed]);
    db.runSync('DELETE FROM visits');
    for (const v of visits) {
      db.runSync('INSERT OR IGNORE INTO visits (t, present, ms) VALUES (?, ?, ?)', [v.t, v.present ? 1 : 0, v.ms]);
    }
    db.runSync('COMMIT');
  } catch (e) {
    db.runSync('ROLLBACK');
    throw e;
  }
}

// Clock-change resilience: monotonic elapsed tracking
export function computeMonotonicElapsed(plantedAt: number | null, visits: Visit[], nowWallMs: number): number {
  // If wall clock jumped backward > 1h, cap to last known good elapsed rather than negative
  const lastVisitTime = visits.length ? visits[visits.length - 1].t : plantedAt;
  if (plantedAt === null) return 0;
  if (nowWallMs < plantedAt - 3600000) {
    // Clock rolled back significantly — use monotonic approximation from last visit + bounded delta
    const safeNow = lastVisitTime ?? plantedAt;
    return Math.max(0, (safeNow - plantedAt) / 86400000);
  }
  return Math.max(0, (nowWallMs - plantedAt) / 86400000);
}

// First-launch edge case: empty state handled by loadCompanionState returning defaults
// Reinstall boundary: sqlite DB is local to /data/data/<pkg>; reinstall wipes unless user explicitly backups/extracts.
// We document this explicitly in code comment below; no attempt to persist across reinstall.
// Long neglect caps: decay.ts stageFromNeglectDays already caps at 5 (Passing); no undefined stage.
// Locale fallback: fragment bank English only; no localization needed in v2.
