// @vitest-environment node
import { describe, expect, it } from 'vitest';
import { AI_RESTRICTED_COUNTRY_CODES, getAiRegionAccess } from '../region-policy';

describe('AI regional distribution policy', () => {
  it('blocks the EEA, Switzerland, and the United Kingdom without restricting the catalog policy elsewhere', () => {
    expect([...AI_RESTRICTED_COUNTRY_CODES].sort()).toEqual([
      'AT', 'BE', 'BG', 'CH', 'CY', 'CZ', 'DE', 'DK', 'EE', 'ES', 'EU', 'FI', 'FR', 'GB', 'GR', 'HR', 'HU', 'IE', 'IS',
      'IT', 'LI', 'LT', 'LU', 'LV', 'MT', 'NL', 'NO', 'PL', 'PT', 'RO', 'SE', 'SI', 'SK',
      'UK',
    ]);
    for (const country of AI_RESTRICTED_COUNTRY_CODES) expect(getAiRegionAccess(country)).toBe('restricted');
    expect(getAiRegionAccess('BR')).toBe('allowed');
    expect(getAiRegionAccess('US')).toBe('allowed');
  });

  it.each([null, '', ' ', 'XX', 'ZZ', 'AA', 'BRA', '1A', 'A'])('fails closed for unknown or invalid geolocation: %s', country => {
    expect(getAiRegionAccess(country)).toBe('unknown');
  });

  it('normalizes platform country codes without accepting partial or malformed values', () => {
    expect(getAiRegionAccess(' br ')).toBe('allowed');
    expect(getAiRegionAccess(' gb ')).toBe('restricted');
  });
});
