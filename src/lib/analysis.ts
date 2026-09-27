import { MS_DAY, type Visit } from './decay';

export type Pattern =
  | 'never'
  | 'one-visit'
  | 'burst-then-silence'
  | 'frequent-then-silence'
  | 'sparse'
  | 'steady';

export type Life = {
  lifespanDays: number;
  /** visits where the visitor actually stayed */
  visits: number;
  /** every recorded open, present or not */
  opens: number;
  longestGapDays: number;
  /** the gap between the last real visit and the passing */
  finalGapDays: number;
  longestVisitMs: number;
  longestVisitDay: number | null;
  firstVisitDay: number | null;
  firstVisitAt: number | null;
  pattern: Pattern;
};

export function analyzeLife(
  plantedAt: number,
  visits: Visit[],
  passedAt: number,
): Life {
  const lifespanDays = Math.max(0, (passedAt - plantedAt) / MS_DAY);
  const real = visits.filter((v) => v.present).sort((a, b) => a.t - b.t);
  const opens = visits.length;

  const gaps: number[] = [];
  let cursor = plantedAt;
  for (const visit of real) {
    gaps.push((visit.t - cursor) / MS_DAY);
    cursor = visit.t;
  }
  const finalGapDays = Math.max(0, (passedAt - cursor) / MS_DAY);
  if (real.length > 0) gaps.push(finalGapDays);

  const longestGapDays = gaps.length > 0 ? Math.max(...gaps) : lifespanDays;

  let longestVisitMs = 0;
  let longestVisitDay: number | null = null;
  for (const visit of real) {
    if (visit.ms > longestVisitMs) {
      longestVisitMs = visit.ms;
      longestVisitDay = Math.floor((visit.t - plantedAt) / MS_DAY) + 1;
    }
  }

  const firstVisitDay =
    real.length > 0 ? Math.floor((real[0].t - plantedAt) / MS_DAY) + 1 : null;
  const firstVisitAt = real.length > 0 ? real[0].t : null;

  const density = lifespanDays > 0 ? real.length / lifespanDays : 0;
  const tailIsSilent = lifespanDays > 0 && finalGapDays / lifespanDays >= 0.4;
  const half = plantedAt + (passedAt - plantedAt) / 2;
  const earlyShare =
    real.length > 0 ? real.filter((v) => v.t <= half).length / real.length : 0;

  let pattern: Pattern;
  if (real.length === 0) pattern = 'never';
  else if (real.length === 1) pattern = 'one-visit';
  else if (tailIsSilent && earlyShare >= 0.65 && real.length >= 3)
    pattern = 'burst-then-silence';
  else if (tailIsSilent && real.length >= 3) pattern = 'frequent-then-silence';
  else if (density < 0.12) pattern = 'sparse';
  else pattern = 'steady';

  return {
    lifespanDays,
    visits: real.length,
    opens,
    longestGapDays,
    finalGapDays,
    longestVisitMs,
    longestVisitDay,
    firstVisitDay,
    firstVisitAt,
    pattern,
  };
}
