/** Small number → words helpers, so counts read like prose instead of data. */

const ONES = [
  'zero',
  'one',
  'two',
  'three',
  'four',
  'five',
  'six',
  'seven',
  'eight',
  'nine',
  'ten',
  'eleven',
  'twelve',
  'thirteen',
  'fourteen',
  'fifteen',
  'sixteen',
  'seventeen',
  'eighteen',
  'nineteen',
];

const TENS = ['', '', 'twenty', 'thirty', 'forty', 'fifty', 'sixty', 'seventy', 'eighty', 'ninety'];

const IRREGULAR_ORDINALS: Record<string, string> = {
  one: 'first',
  two: 'second',
  three: 'third',
  five: 'fifth',
  eight: 'eighth',
  nine: 'ninth',
  twelve: 'twelfth',
};

function underHundred(n: number): string {
  if (n < 20) return ONES[n];
  const tens = Math.floor(n / 10);
  const ones = n % 10;
  return ones === 0 ? TENS[tens] : `${TENS[tens]}-${ONES[ones]}`;
}

function underThousand(n: number): string {
  if (n < 100) return underHundred(n);
  const hundreds = Math.floor(n / 100);
  const rest = n % 100;
  const head = `${ONES[hundreds]} hundred`;
  return rest === 0 ? head : `${head} ${underHundred(rest)}`;
}

/** 0 … 999,999. Falls back to digits beyond that. */
export function word(n: number): string {
  const v = Math.max(0, Math.round(n));
  if (v === 0) return 'zero';
  if (v > 999_999) return String(v);
  if (v < 1000) return underThousand(v);
  const thousands = Math.floor(v / 1000);
  const rest = v % 1000;
  const head = `${underThousand(thousands)} thousand`;
  return rest === 0 ? head : `${head} ${underThousand(rest)}`;
}

/** "seventh", "twelfth", "forty-first" */
export function ordinal(n: number): string {
  const v = Math.max(1, Math.round(n));
  if (v > 999_999) return `${v}th`;
  const cardinal = word(v);
  const irregular = IRREGULAR_ORDINALS[cardinal];
  if (irregular) return irregular;
  if (cardinal.endsWith('y')) return `${cardinal.slice(0, -1)}ieth`;
  if (cardinal.endsWith('e')) return `${cardinal}th`;
  const hyphen = cardinal.lastIndexOf('-');
  if (hyphen >= 0) {
    const head = cardinal.slice(0, hyphen + 1);
    return `${head}${ordinal(Number(cardinal.slice(hyphen + 1)))}`;
  }
  return `${cardinal}th`;
}

/** "one day" / "forty-one days" */
export function daysPhrase(n: number): string {
  const v = Math.max(0, Math.round(n));
  return v === 1 ? 'one day' : `${word(v)} days`;
}

/** "the eleventh day" / "day one" */
export function dayPhrase(n: number): string {
  const v = Math.max(0, Math.round(n));
  return v <= 1 ? 'the first day' : `the ${ordinal(v)} day`;
}

export function cap(text: string): string {
  return text.length === 0 ? text : text[0].toUpperCase() + text.slice(1);
}
