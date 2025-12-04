import { format } from 'date-fns';
import { ru, enUS } from 'date-fns/locale';

/**
 * Format a date with the appropriate locale
 * @param date The date to format
 * @param formatString The format string to use
 * @param language The language code ('ru' or 'en')
 * @returns The formatted date string
 */
export function formatDate(
  date: Date | string | number,
  formatString: string,
  language: 'ru' | 'en' = 'ru'
): string {
  const dateObj = typeof date === 'string' || typeof date === 'number' 
    ? new Date(date) 
    : date;
  
  // Return a placeholder if the date is invalid
  if (isNaN(dateObj.getTime())) {
    return '—';
  }
  
  const locale = language === 'ru' ? ru : enUS;
  return format(dateObj, formatString, { locale });
}