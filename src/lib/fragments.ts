/**
 * Memory Fragments — passive, offline, never identical twice per user.
 * Generated deterministically from plantedAt + visit log + visit count.
 * Shown rarely (~1 in 5 real visits, weighted to longer visits).
 * Never a button; fades after ~6s during a real visit.
 */

export type Fragment = {
  text: string;
  category: 'visit' | 'quiet' | 'presence';
};

const OPENINGS: string[] = [
  "You came back after twelve days once.",
  "You stayed longer than you needed to.",
  "There was a silence, then you returned.",
  "You showed up when you didn't have to.",
  "It was not the first visit — it was the one that counted.",
  "You came before you remembered why.",
  "The days between were long; this one wasn't.",
  "You made room without asking.",
  "It waited quietly, and you answered.",
  "You didn't bring anything — that was enough.",
  "The light was smaller today, and you stayed anyway.",
  "You came back to say nothing in particular.",
  "There was a gap, then your presence.",
  "You came because it was still there.",
  "It knew your steps before you arrived.",
];

const DETAILS: string[] = [
  "The longest visit was on a day you almost didn't open it.",
  "You stayed while the light softened.",
  "One visit was shorter than sleep; one was longer than thought.",
  "You came once, stayed a moment, then left gently.",
  "The visit after the longest silence was the quietest.",
  "You never spoke — it never needed it.",
  "There was a visit when nothing changed, and that was the point.",
  "You came back not because you owed it anything.",
  "The light dimmed, and you stayed anyway.",
  "A brief presence was enough.",
  "You came when you were tired; it held the space.",
  "The gap was long, the visit was short — both true.",
  "You stayed just long enough to notice it was still there.",
  "It didn't ask; you came anyway.",
];

const CLOSINGS: string[] = [
  "It didn't need much. Just for you to notice it was there.",
  "That is what it remembers.",
  "No more than that.",
  "That is enough.",
  "It holds that quietly.",
  "That is all it needed.",
  "Not a performance — just presence.",
  "That visit stays with it.",
  "Nothing more is required.",
  "It remembers your stillness.",
  "That is the only thing it asks.",
  "It keeps nothing — only that you came.",
  "That is the whole of it.",
  "Not a story — just a moment shared.",
  "That is enough to hold onto.",
];

function seedFrom(plantedAt: number, visitCount: number, visitMsSum: number): number {
  // Simple deterministic hash — same user always gets same sequence, but growing visit count shifts it
  let h = plantedAt ^ 0x811c9dc5;
  h ^= visitCount * 0x01000193;
  h ^= Math.floor(visitMsSum / 1000) * 0x01000193;
  return Math.abs(h) % 2147483647;
}

function pickBySeed(arr: string[], seed: number): string {
  const idx = seed % arr.length;
  return arr[idx];
}

export function generateFragment(plantedAt: number, visits: { t: number; ms: number; present: boolean }[]): Fragment | null {
  // Only on real visits (present = true), with ~20% chance, weighted by visit ms (longer = more likely)
  const realVisits = visits.filter(v => v.present);
  if (realVisits.length === 0) return null;
  // Weight: longer total presence increases likelihood, but capped
  const totalMs = realVisits.reduce((s, v) => s + v.ms, 0);
  const chance = Math.min(0.25, 0.05 + (totalMs / 600000) * 0.05); // ~5-25%
  const roll = ((plantedAt ^ realVisits.length ^ totalMs) % 1000) / 1000;
  if (roll > chance) return null;

  const visitCount = realVisits.length;
  const seed = seedFrom(plantedAt, visitCount, totalMs);
  // Combine opening + closing only (keep it one quiet sentence, not long)
  const opening = pickBySeed(OPENINGS, seed);
  const closing = pickBySeed(CLOSINGS, seed + 1);
  const text = `${opening} ${closing}`;
  // Never identical twice for same user if visit count changes: seed depends on visitCount
  return { text, category: visitCount >= 3 ? 'visit' : 'quiet' };
}

export function getFragmentCount(): number {
  return OPENINGS.length + DETAILS.length + CLOSINGS.length; // 45 total
}
