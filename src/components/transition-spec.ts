/**
 * Transition design spec — implement via Reanimated + Skia cross-fade
 * 2-3s slow cross-fade between decay stages (no snap). Death reveal is the slowest.
 */
export const DECAY_TRANSITION_MS = 2500; // stage change
export const DEATH_REVEAL_MS = 3500;     // final visit -> certificate (quietest moment)

// Easing: slow ease-in-out, never bounce, never sharp
export const quietEase = { duration: DECAY_TRANSITION_MS, easing: (t: number) => t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2 };
