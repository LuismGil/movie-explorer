// @vitest-environment node
import { describe, expect, it } from 'vitest';
import { messages } from '@/i18n';
import { catalogMessages } from '@/i18n/catalog';
import { aiMessages } from '@/i18n/ai';

describe('independent message namespaces', () => {
  it('retains the complete dictionary API without duplicating namespace objects', () => {
    for (const key of Object.keys(catalogMessages) as Array<keyof typeof catalogMessages>) {
      expect(messages[key]).toBe(catalogMessages[key]);
    }
    expect(messages.ai).toBe(aiMessages);
  });

  it('does not expose the Discover-only dictionary through catalog imports', () => {
    expect(catalogMessages).not.toHaveProperty('ai');
    expect(Object.keys(messages)).toEqual([...Object.keys(catalogMessages), 'ai']);
  });

  it.each([
    [0, '0 s'], [1, '1 s'], [59, '59 s'], [60, '1 min 0 s'], [3661, '1 h 1 min 1 s'],
  ])('preserves the quota formatter at %s seconds', (seconds, duration) => {
    expect(aiMessages.rateLimitWait(Number(seconds))).toBe(`Você poderá tentar novamente em ${duration}.`);
    expect(messages.ai.rateLimitWait).toBe(aiMessages.rateLimitWait);
  });
});
