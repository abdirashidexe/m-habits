import { ar, enUS, ur } from 'date-fns/locale';

/**
 * @param {string} lang en | ar | ur | so
 */
export function getDateFnsLocale(lang) {
  switch (lang) {
    case 'ar':
      return ar;
    case 'ur':
      return ur;
    case 'so':
    case 'en':
    default:
      return enUS;
  }
}
