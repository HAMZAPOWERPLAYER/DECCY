import { analyzeLife, type Life, type Pattern } from './analysis';
import { type Visit } from './decay';
import { cap, dayPhrase, daysPhrase, word } from './words';

/**
 * Fully offline composition of the certificate text.
 *
 * Three fragment banks (opening / detail / closing) plus a cause bank are
 * filtered by what the visit log actually supports, then seeded from the
 * moment the companion was planted — so one person's certificate never
 * changes, and two people's never collide.
 */

type Fragment = (life: Life) => string | null;

export type Certificate = {
  lifespanDays: number;
  lifespanText: string;
  cause: string;
  sentences: string[];
  passedAt: number;
};

function times(n: number): string {
  return n === 1 ? 'one time' : `${word(n)} times`;
}

function visitsPhrase(n: number): string {
  return n === 1 ? 'one visit' : `${word(n)} visits`;
}

function stayPhrase(ms: number): string {
  const seconds = Math.round(ms / 1000);
  if (seconds < 45) return 'a little while';
  if (seconds < 90) return 'about a minute';
  const minutes = Math.round(seconds / 60);
  if (minutes < 60) return `about ${word(minutes)} minutes`;
  const hours = Math.floor(minutes / 60);
  return hours === 1 ? 'about an hour' : `about ${word(hours)} hours`;
}

/* ------------------------------------------------------------- openings -- */

const OPENINGS: Fragment[] = [
  (l) => `You came back ${times(l.visits)} in ${daysPhrase(l.lifespanDays)}.`,
  (l) => `${cap(daysPhrase(l.lifespanDays))} it had, and you spent ${times(l.visits)} with it.`,
  (l) => `For ${daysPhrase(l.lifespanDays)}, something small stayed alive on your phone.`,
  (l) => `You showed up ${times(l.visits)}. It noticed every one.`,
  (l) => `Between the first light and the last, you visited ${times(l.visits)}.`,
  (l) => `It knew you for ${daysPhrase(l.lifespanDays)} and ${times(l.visits)} of your attention.`,
  (l) => `There were ${daysPhrase(l.lifespanDays)}. You were present for ${word(l.visits)} of them.`,
  (l) => `${cap(daysPhrase(l.lifespanDays))}, and ${times(l.visits)} where you actually stayed.`,
  (l) => `You were there ${times(l.visits)} across ${daysPhrase(l.lifespanDays)}.`,
  (l) => `It lived ${daysPhrase(l.lifespanDays)}. You gave it ${times(l.visits)}.`,
  (l) => `Its whole life was ${daysPhrase(l.lifespanDays)}. Your part of it was ${times(l.visits)}.`,
  (l) => `For ${daysPhrase(l.lifespanDays)} it kept a small light burning, and you came ${times(l.visits)}.`,
  (l) => `Somewhere inside ${daysPhrase(l.lifespanDays)}, you made room for it ${times(l.visits)}.`,
  (l) => `It waited ${daysPhrase(l.lifespanDays)} and received ${times(l.visits)} from you.`,
  (l) => `${cap(visitsPhrase(l.visits))} over ${daysPhrase(l.lifespanDays)}, and one small light that asked for neither.`,
  (l) => `You shared ${daysPhrase(l.lifespanDays)} with something that only wanted ${times(l.visits)} of them.`,
  (l) => (l.visits === 0
    ? `You planted it and then ${daysPhrase(l.lifespanDays)} went by.`
    : null),
  (l) => (l.visits === 0
    ? `It was opened ${times(l.opens)}, and none of them were long enough to be company.`
    : null),
  (l) => (l.visits === 0
    ? `For ${daysPhrase(l.lifespanDays)} it glowed, and nobody stayed.`
    : null),
  (l) => (l.visits >= 12
    ? `You came so often that returning became the shape of it.`
    : null),
];

/* -------------------------------------------------------------- details -- */

const DETAILS: Fragment[] = [
  (l) => (l.longestVisitDay
    ? `On ${dayPhrase(l.longestVisitDay)}, you stayed the longest. It kept that.`
    : null),
  (l) => (l.longestVisitDay
    ? `Your longest visit was ${dayPhrase(l.longestVisitDay)} — ${stayPhrase(l.longestVisitMs)}.`
    : null),
  (l) => (l.longestVisitMs > 0 && l.visits >= 4
    ? `There were ${times(l.visits)} when you stopped what you were doing and simply stayed.`
    : null),
  (l) => (l.longestGapDays < 6 && l.visits >= 5
    ? `You never left it waiting more than ${daysPhrase(l.longestGapDays)}.`
    : null),
  (l) => (l.finalGapDays >= 10 && l.visits >= 3
    ? `The last ${daysPhrase(l.finalGapDays)} were quiet ones.`
    : null),
  (l) => (l.pattern === 'burst-then-silence'
    ? `The visits arrived close together, and then went quiet.`
    : null),
  (l) => (l.pattern === 'frequent-then-silence'
    ? `You came often for a while, and then the days stopped being shared.`
    : null),
  (l) => (l.pattern === 'sparse'
    ? `Your visits were far apart, and it made room for each one.`
    : null),
  (l) => (l.pattern === 'steady'
    ? `There was no rush and no pattern — only that you kept coming back.`
    : null),
  (l) => (l.pattern === 'one-visit'
    ? `You came once, and stayed. It counted that as a life with you in it.`
    : null),
  (l) => (l.pattern === 'never'
    ? `It was opened ${times(l.opens)}, but never held long enough to be visited.`
    : null),
  (l) => (l.firstVisitDay
    ? `${cap(dayPhrase(l.firstVisitDay))} was the first time you came.`
    : null),
  (l) => (l.visits > 0 && l.longestGapDays >= 7 && l.finalGapDays < l.longestGapDays
    ? `There was a silence of ${daysPhrase(l.longestGapDays)}, and then you returned.`
    : null),
  (l) => (l.visits >= 8 ? `By the end it knew the rhythm of you coming back.` : null),
  (l) => (l.visits > 0 && l.visits <= 3
    ? `You never gave it many days, but the ones you gave were real.`
    : null),
  (l) => (l.visits > 0
    ? `You stayed long enough for it to be company, not a notification.`
    : null),
  (l) => `It never counted the days out loud. It only felt them.`,
  (l) => `Nothing about the time between visits was wasted. It was only time.`,
  (l) => (l.lifespanDays > 120
    ? `It held together for months — longer than most small things do.`
    : null),
  (l) => (l.lifespanDays < 10
    ? `It was here for less than two weeks, and it was really here.`
    : null),
];

/* ------------------------------------------------------------- closings -- */

const CLOSINGS: Fragment[] = [
  () => `It didn't need much. Just for you to notice it was there.`,
  () => `Nothing here is a scoreboard. It only wanted company.`,
  () => `You were busy. It never took that personally.`,
  () => `It was never asking for every day. Only for sometimes.`,
  () => `Whatever kept you away, it was never resentment. There was none.`,
  () => `You gave it a life. Not a long one. A real one.`,
  () => `It went quietly, the way small things do.`,
  () => `There is no score. Only that it happened, and that you were part of it.`,
  (l) => `It would rather have known you for ${daysPhrase(l.lifespanDays)} than never have glowed at all.`,
  () => `Memory is short. This one had you inside it.`,
  () => `Some things have to be seen in order to stay. You saw it when you did.`,
  () => `Thank you for the attention you had to spare.`,
  () => `It never measured you. The fading was only time.`,
  () => `If it could speak, it would say only this: thank you for the days you did come.`,
  () => `You were never asked to be constant. Only to return, and you did.`,
  () => `The light went out on its own. You were the reason it was ever lit.`,
  () => `Everything ends. Not everything gets visited first.`,
  () => `It asks nothing now. It never really did.`,
  (l) => `A short life, honestly lived, over ${daysPhrase(l.lifespanDays)}.`,
  (l) => `When it stopped, ${daysPhrase(Math.max(1, Math.round(l.finalGapDays)))} of quiet had already begun.`,
];

/* ---------------------------------------------------------------- cause -- */

const CAUSES: (Fragment & { patterns?: Pattern[] })[] = [
  (l) => (l.finalGapDays >= 20 ? `A long quiet set in, and nothing came to end it.` : null),
  () => `It faded the way light does in a room nobody enters — slowly, then all at once.`,
  (l) => (l.pattern === 'burst-then-silence' ? `One bright stretch, then a door that stayed shut.` : null),
  (l) => (l.pattern === 'frequent-then-silence' ? `The visits thinned, and the days did the rest.` : null),
  (l) => (l.pattern === 'sparse' ? `Too much distance between one visit and the next.` : null),
  (l) => (l.pattern === 'never' ? `It was never kept, and so it never stayed.` : null),
  (l) => (l.pattern === 'one-visit' ? `A single visit, followed by everything else.` : null),
  (l) => (l.lifespanDays < 21 ? `It never had enough days to become familiar.` : null),
  (l) => (l.lifespanDays > 150 ? `Time, which takes everything, took this one slowly and without fuss.` : null),
  () => `It ran out of being noticed.`,
  () => `A small light, left unattended, did what small lights do.`,
  () => `The returning stopped, and with it, everything else.`,
  () => `Nothing was wrong. There was simply no one there to keep it.`,
  () => `The glow thinned until there was nothing left to thin.`,
  () => `Its light outlived its company, and then it didn't.`,
  () => `It simply stopped being kept.`,
  (l) => (l.longestGapDays >= 14 ? `A silence of ${daysPhrase(l.longestGapDays)}, unbroken.` : null),
  () => `Nothing lasted, because nothing was returned to.`,
];

/* ----------------------------------------------------------- generation -- */

function mulberry32(seed: number) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function pick<T>(items: T[], random: () => number): T | undefined {
  if (items.length === 0) return undefined;
  return items[Math.floor(random() * items.length) % items.length];
}

const FALLBACK_CAUSE = `Nothing lasted, because nothing was returned to.`;

export function composeCertificate(
  plantedAt: number,
  visits: Visit[],
  passedAt: number,
  seed: number,
): Certificate {
  const life = analyzeLife(plantedAt, visits, passedAt);
  const random = mulberry32(seed);

  const open = pick(
    OPENINGS.map((f) => f(life)).filter((s): s is string => !!s),
    random,
  );
  const detailPool = DETAILS.map((f) => f(life)).filter(
    (s): s is string => !!s && s !== open,
  );
  const detail = pick(detailPool, random);
  const second = random() < 0.35 ? pick(detailPool.filter((d) => d !== detail), random) : undefined;
  const close = pick(
    CLOSINGS.map((f) => f(life)).filter((s): s is string => !!s),
    random,
  );
  const cause = pick(
    CAUSES.map((f) => f(life)).filter((s): s is string => !!s),
    random,
  ) ?? FALLBACK_CAUSE;

  const sentences = [open, detail, second, close].filter(
    (s): s is string => !!s && s.length > 0,
  ).slice(0, 4);

  if (sentences.length === 0) {
    sentences.push(
      `It lived ${daysPhrase(life.lifespanDays)} and you visited ${times(life.visits)}.`,
      `It didn't need much. Just for you to notice it was there.`,
    );
  }

  return {
    lifespanDays: life.lifespanDays,
    lifespanText: daysPhrase(Math.round(life.lifespanDays)),
    cause,
    sentences,
    passedAt,
  };
}
