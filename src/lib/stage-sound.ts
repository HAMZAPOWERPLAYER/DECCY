/**
 * Stage-based piano sound segments derived from the single source loop.
 * Time ranges are conservative estimates for the "Momentary Sadness" loop;
 * fine-tune after first listen (edit segment boundaries, not logic).
 */
export const PIANO_SOURCE = require('../../assets/audio/piano_full.wav');

// Conservative phrase estimates for a ~45-60s sparse piano loop
export const SEGMENTS = {
  vibrant:   { start: 0,  end: 9 },   // first full phrase/phrase
  dimming:   { start: 0,  end: 9 },   // same motif, softer
  fading:    { start: 0,  end: 4 },   // first half / sparse
  cracking:  { start: 0,  end: 2 },   // single note onset; gap handled by silence
  barely:    { start: 0,  end: 1.5 }, // one faint note
  deathFull: { start: 0,  end: -1 },  // -1 = play to end (full original)
} as const;

export type StageSoundKey = keyof typeof SEGMENTS;

export const STAGE_VOLUME: Record<number, number> = {
  0: 0.65,  // vibrant
  1: 0.55,  // dimming (~15% down)
  2: 0.38,  // fading
  3: 0.22,  // cracking
  4: 0.12,  // barely
  5: 0.0,   // passing (death moment — silence first)
};

export const STAGE_RATE: Record<number, number> = {
  0: 1.0,
  1: 0.92,
  2: 0.85,
  3: 0.78,
  4: 0.72,
  5: 1.0,   // death: full at normal/slightly elevated
};
