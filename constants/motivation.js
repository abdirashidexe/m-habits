export const MOTIVATIONAL_QUOTES = [
  'The most beloved deeds to Allah are those done consistently, even if small.',
  'Allah does not burden a soul beyond that it can bear — take one step at a time.',
  'Verily, with hardship comes ease.',
  'Tie your camel, then trust in Allah.',
  'The strong believer is better and more beloved to Allah than the weak believer.',
  'Be mindful of Allah, and you will find Him before you.',
  'The world is the believer’s prison and the disbeliever’s paradise.',
  'Whoever follows a path seeking knowledge, Allah will make easy for him the path to Paradise.',
  'Let not your heart be attached to what perishes — build for the lasting home.',
  'Allah is with the patient — keep going with sincerity.',
];

/**
 * @param {number} dayOfYear 0-365
 * @returns {string}
 */
export function quoteForDay(dayOfYear) {
  const i = Math.abs(dayOfYear) % MOTIVATIONAL_QUOTES.length;
  return MOTIVATIONAL_QUOTES[i];
}
