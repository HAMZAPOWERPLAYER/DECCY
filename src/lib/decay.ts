/**
 * Decay model.
 *
 * Two pressures act on the companion at once:
 *
 *  1. Neglect — measured from the last *real* visit (one where you actually
 *     stayed), and it is what drives the visible day-by-day fading.
 *  2. Impermanence — a slow horizon that no amount of care can outrun, so that
 *     nothing lives forever.
 *
 * A real visit buys back roughly twelve days of neglect: enough to step back
 * a stage, never enough to erase a long absence in one go.
 */

export const MS_DAY = 86_400_000;

export const STAGE_NAMES = [
  'Vibrant',
  'Dimming',
  'Fading',
  'Cracking',
  'Barely Holding On',
  'Passing',
] as const;

export type StageIndex = 0 | 1 | 2 | 3 | 4 | 5;

export type Visit = {
  /** epoch ms */
  t: number;
  /** true only when the visitor stayed long enough to count as presence */
  present: boolean;
  /** how long the screen was held, in ms */
  ms: number;
};

const STAGE_DOORWAYS = [3, 7, 14, 26, 46];

/** Days of neglect purchased back by a single real visit. */
const HEAL_PER_VISIT = 12;

/** Horizon at zero visits, extra day per visit, and the cap on that bonus. */
const HORIZON_BASE = 170;
const HORIZON_PER_VISIT = 1;
const HORIZON_MAX_VISITS = 100;

/** How hard the horizon bites late in life. Higher = gentler at first. */
const HORIZON_CURVATURE = 4;

export type DecayInput = {
  plantedAt: number;
  visits: Visit[];
  now: number;
};

export type DecayState = {
  ageDays: number;
  neglectDays: number;
  horizonDays: number;
  stage: StageIndex;
  dead: boolean;
};

function stageFromNeglectDays(days: number): StageIndex {
  if (days < STAGE_DOORWAYS[0]) return 0;
  if (days < STAGE_DOORWAYS[1]) return 1;
  if (days < STAGE_DOORWAYS[2]) return 2;
  if (days < STAGE_DOORWAYS[3]) return 3;
  if (days < STAGE_DOORWAYS[4]) return 4;
  return 5;
}

/**
 * Replays the visit history so the result is deterministic: the same state at
 * the same moment always produces the same stage, no matter how often it is
 * recomputed or whether the device clock moved.
 */
export function neglectDays({ plantedAt, visits, now }: DecayInput): number {
  const real = visits.filter((v) => v.present).sort((a, b) => a.t - b.t);
  let score = 0;
  let cursor = Math.min(plantedAt, now);
  for (const visit of real) {
    const t = Math.min(Math.max(visit.t, cursor), now);
    score += (t - cursor) / MS_DAY;
    score = Math.max(0, score - HEAL_PER_VISIT);
    cursor = t;
  }
  score += (now - cursor) / MS_DAY;
  return score;
}

export function computeDecay({ plantedAt, visits, now }: DecayInput): DecayState {
  const clampedNow = Math.max(now, plantedAt);
  const ageDays = (clampedNow - plantedAt) / MS_DAY;

  const neglect = neglectDays({ plantedAt, visits, now: clampedNow });
  const realVisits = visits.filter((v) => v.present).length;

  const horizonDays = HORIZON_BASE + Math.min(realVisits, HORIZON_MAX_VISITS) * HORIZON_PER_VISIT;
  const horizonRatio = Math.max(0, ageDays / Math.max(horizonDays, 1));
  const horizonAsNeglect = Math.pow(horizonRatio, HORIZON_CURVATURE) * STAGE_DOORWAYS[4];

  const stage = Math.max(stageFromNeglectDays(neglect), stageFromNeglectDays(horizonAsNeglect));

  return {
    ageDays,
    neglectDays: neglect,
    horizonDays,
    stage: stage as StageIndex,
    dead: stage >= 5,
  };
}

export function stageOfDayBoundary(stage: StageIndex): number {
  return STAGE_DOORWAYS[Math.min(stage, STAGE_DOORWAYS.length - 1)];
}
