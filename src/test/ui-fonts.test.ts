// @vitest-environment node
import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { messages } from '@/i18n';
import manifest from '@/theme/ui-fonts.json';
import fullFonts from '@/theme/full-fonts.json';

function staticCopy(value: unknown): string {
  if (typeof value === 'string') return value;
  if (value && typeof value === 'object') return Object.values(value).map(staticCopy).join('');
  return '';
}

describe('critical UI fonts', () => {
  const copy = staticCopy(messages);
  // These decorative glyphs were already supplied by the platform, not these families.
  const platformSymbols = new Set(['←', '↗']);
  const interfaceCopy = [...new Set(copy + copy.toUpperCase())].filter(char => !platformSymbols.has(char) && !/\s/u.test(char));

  for (const font of manifest) {
    it(`${font.family} covers Portuguese copy, uppercase eyebrows and arbitrary ASCII names`, () => {
      const supported = new Set(font.characters);
      expect(interfaceCopy.filter(char => !supported.has(char))).toEqual([]);
      for (let codepoint = 32; codepoint <= 126; codepoint++) {
        expect(supported.has(String.fromCodePoint(codepoint))).toBe(true);
      }
    });

    it(`${font.family} pins the inspected WOFF2 binary`, () => {
      const binary = readFileSync(new URL(`../theme/fonts/${font.file}`, import.meta.url));
      expect(binary.subarray(0, 4).toString()).toBe('wOF2');
      expect(binary.byteLength).toBe(font.bytes);
      expect(createHash('sha256').update(binary).digest('hex')).toBe(font.sha256);
    });
  }

  for (const [index, family] of ['display', 'body', 'mono'].entries()) {
    it(`${family} retains the original complete-family assets`, () => {
      for (const font of fullFonts.filter(font => font.family === family)) {
        const binary = readFileSync(new URL(`../theme/fonts/full/${font.file}`, import.meta.url));
        expect(binary.byteLength).toBe(font.bytes);
        expect(createHash('sha256').update(binary).digest('hex')).toBe(font.sha256);
      }
    });

    it(`${family} never downloads a full asset for a glyph covered by the UI subset`, () => {
      const css = readFileSync(new URL('../theme/fonts-full.css', import.meta.url), 'utf8');
      const name = ['Sora', 'Hanken Grotesk', 'JetBrains Mono'][index];
      const coverage = new Set<number>();
      for (const [rule] of css.matchAll(/@font-face\s*\{[^}]+\}/g)) {
        if (!rule.includes(`font-family: "${name} Full"`)) continue;
        const ranges = /unicode-range: ([^;]+)/.exec(rule)?.[1];
        expect(ranges).toBeDefined();
        for (const range of ranges!.split(',')) {
          const [start, end = start] = range.replace('U+', '').split('-').map(value => parseInt(value, 16));
          for (let codepoint = start; codepoint <= end; codepoint++) {
            expect(coverage.has(codepoint)).toBe(false);
            coverage.add(codepoint);
          }
        }
      }
      for (const character of manifest[index].characters) {
        expect(coverage.has(character.codePointAt(0)!)).toBe(false);
      }
      for (const character of family === 'mono' ? 'ÄŻЖΩ' : 'ÄŻ') {
        expect(coverage.has(character.codePointAt(0)!)).toBe(true);
      }
    });
  }

  it('keeps complete families behind the subset instead of restricting dynamic titles', () => {
    const css = readFileSync(new URL('../index.css', import.meta.url), 'utf8');
    for (const family of ['display', 'body', 'mono']) {
      expect(css).toContain(`--font-${family}: var(--font-${family}-ui), var(--font-${family}-full);`);
    }
    expect(manifest.reduce((sum, font) => sum + font.bytes, 0)).toBeLessThan(50_000);
  });
});
