/** @typedef {'en' | 'ar' | 'ur' | 'so'} LanguageId */

/** @type {readonly LanguageId[]} */
export const LANGUAGE_IDS = ['en', 'ar', 'ur', 'so'];

/** @type {{ id: LanguageId; native: string }[]} */
export const LANGUAGES = [
  { id: 'en', native: 'English' },
  { id: 'ar', native: 'العربية' },
  { id: 'ur', native: 'اردو' },
  { id: 'so', native: 'Soomaali' },
];

/**
 * @param {unknown} id
 * @returns {LanguageId}
 */
export function coerceLanguageId(id) {
  return LANGUAGE_IDS.includes(id) ? id : 'en';
}
