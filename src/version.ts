// Application version and build timestamp information
declare global {
  const __BUILD_TIMESTAMP__: string | undefined;
}

export const APP_VERSION = '2.5.1';

// Build timestamp injected via Vite define at build/bundle time, or ISO fallback
export const BUILD_TIMESTAMP: string =
  typeof __BUILD_TIMESTAMP__ !== 'undefined' && __BUILD_TIMESTAMP__
    ? __BUILD_TIMESTAMP__
    : new Date().toISOString();

// ISO Date string YYYY-MM-DD
export const BUILD_DATE: string = BUILD_TIMESTAMP.includes('T')
  ? BUILD_TIMESTAMP.split('T')[0]
  : BUILD_TIMESTAMP;

/**
 * Returns formatted build date and time string (e.g. "Aug 17, 2026, 12:55:10 PM PDT")
 */
export function getFormattedBuildTimestamp(locale = 'en-US'): string {
  try {
    const date = new Date(BUILD_TIMESTAMP);
    if (isNaN(date.getTime())) return BUILD_TIMESTAMP;
    return new Intl.DateTimeFormat(locale, {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
      second: '2-digit',
      timeZoneName: 'short',
    }).format(date);
  } catch {
    return BUILD_TIMESTAMP;
  }
}

/**
 * Returns formatted build date only (e.g. "August 17, 2026")
 */
export function getFormattedBuildDate(locale = 'en-US'): string {
  try {
    const date = new Date(BUILD_TIMESTAMP);
    if (isNaN(date.getTime())) return BUILD_DATE;
    return new Intl.DateTimeFormat(locale, {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    }).format(date);
  } catch {
    return BUILD_DATE;
  }
}

/**
 * Returns formatted build time only (e.g. "12:55:10 PM PDT")
 */
export function getFormattedBuildTime(locale = 'en-US'): string {
  try {
    const date = new Date(BUILD_TIMESTAMP);
    if (isNaN(date.getTime())) return '';
    return new Intl.DateTimeFormat(locale, {
      hour: 'numeric',
      minute: '2-digit',
      second: '2-digit',
      timeZoneName: 'short',
    }).format(date);
  } catch {
    return '';
  }
}

export const BUILD_INFO = {
  version: APP_VERSION,
  buildDate: BUILD_DATE,
  timestamp: BUILD_TIMESTAMP,
  formattedTimestamp: getFormattedBuildTimestamp(),
  formattedDate: getFormattedBuildDate(),
  formattedTime: getFormattedBuildTime(),
};
