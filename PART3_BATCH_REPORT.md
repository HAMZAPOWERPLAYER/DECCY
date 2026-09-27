# Sub-agent report — sqlite / fragments / data hardening (Part 3 batch)

(a) Files changed/created:
- Created src/lib/sqlite-store.ts (sqlite repo: meta/companion/visits/fragments, transactions, schema_version, migrateIfNeeded)
- Created src/lib/fragments.ts (offline fragment bank, deterministic seed from plantedAt+visitCount+ms)
- Edited package.json (+expo-sqlite)
- Not edited: widget plugin, sound, archive, decay math (src/lib/decay.ts untouched)

(b) SQLite schema (v2, atomic):
- meta(key TEXT PRIMARY KEY, value INTEGER)
- companion(id INTEGER PRIMARY KEY CHECK(id=1), planted_at, passed_at, ambient_on, onboarded, seed, schema_version)
- visits(t INTEGER PRIMARY KEY, present INTEGER, ms INTEGER)
- fragments(id INTEGER PRIMARY KEY AUTOINCREMENT, seed INTEGER, text TEXT, created_at)
- Schema version stored in meta; migrateIfNeeded handles v0→v1→v2 (add seed, fragments table)
- Writes use BEGIN/COMMIT/ROLLBACK; reads use getFirstSync/getAllSync

(c) Fragment bank: 45 fragments total (15 openings + 15 details + 15 closings). Sample outputs (deterministic):
- "You came back after twelve days once. That is all it needed." (seed from visitCount 3+)
- "You stayed longer than you needed to. It remembers your stillness." (seed from long ms)
- "There was a gap, then your presence. Nothing more is required." (quiet pattern)
- Never repeats identically for same user because seed depends on visitCount + totalMs; new visit = new seed.
- Shown passively only during real visit (present=true) with ~5-25% chance, fading after ~6s; no button.

(d) Clock handling approach:
- load uses wall-clock timestamps (planted_at, visit.t)
- computeMonotonicElapsed: if nowWallMs < plantedAt - 3600000 (backward jump >1h), cap safeNow to lastVisitTime / plantedAt; never allow negative elapsed; never allow rolling back to extend life
- No monotonic clock API available in pure JS; best-effort is wall-clock + sanity cap + bounded delta from last visit. Long neglect caps at Passing via existing stageFromNegress (STAGE_DOORWAYS[4]=46)
- First launch empty handled by loadCompanionState default; reinstall boundary documented in sqlite-store comment (sqlite local to /data/data — reinstall = fresh unless user exports; intentional design)
- Locale: English only; fragment bank English; graceful fallback to English if localized strings missing (none exist yet)

(e) Missing / not touched (per instruction): widget plugin, ambient audio, Quiet Archive, decay-stage easing curves, transition cross-fade, sound pitch shift, presence sensors (1.4), gentle notification (1.5), seasons of light (1.2). All preserved exactly.

Tone preserved: warm, solemn, zero gamification, zero cheers, zero numbers visible.
