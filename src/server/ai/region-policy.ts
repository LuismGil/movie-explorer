import 'server-only';

/** Vercel's server-injected ISO 3166-1 alpha-2 location header. */
export const AI_COUNTRY_HEADER = 'x-vercel-ip-country';

/**
 * Countries where the current Google Free-service distribution policy does not
 * permit offering this API client. Keep the site/catalog public everywhere.
 */
export const AI_RESTRICTED_COUNTRY_CODES = Object.freeze([
  // EEA members
  'AT', 'BE', 'BG', 'CY', 'CZ', 'DE', 'DK', 'EE', 'ES', 'FI', 'FR', 'GR', 'HR', 'HU', 'IE', 'IS',
  'IT', 'LI', 'LT', 'LU', 'LV', 'MT', 'NL', 'NO', 'PL', 'PT', 'RO', 'SE', 'SI', 'SK',
  // Separate territories covered by the current release policy
  'CH', 'GB', 'UK', 'EU',
] as const);
const restrictedCountries = new Set<string>(AI_RESTRICTED_COUNTRY_CODES);

export type AiRegionAccess = 'allowed' | 'restricted' | 'unknown';
const countryNames = new Intl.DisplayNames(['en'], { type: 'region' });

/** Missing/invalid geolocation fails closed for AI only. */
export function getAiRegionAccess(countryHeader: string | null): AiRegionAccess {
  if (!countryHeader) return 'unknown';
  const country = countryHeader.trim().toUpperCase();
  if (!/^[A-Z]{2}$/.test(country) || country === 'XX' || country === 'ZZ') return 'unknown';
  const countryName = countryNames.of(country);
  if (!countryName || countryName === country || countryName === 'Unknown Region') return 'unknown';
  return restrictedCountries.has(country) ? 'restricted' : 'allowed';
}
