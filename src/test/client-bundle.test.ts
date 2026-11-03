// @vitest-environment node
import { mkdtemp, mkdir, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { inspectClientBundle, inspectCatalogEntry } from '../../scripts/check-client-bundle.mjs';

describe('scoped browser bundle boundary check', () => {
  let directory: string;
  beforeEach(async () => { directory = await mkdtemp(join(tmpdir(), 'movie-explorer-bundle-')); });
  afterEach(async () => { await rm(directory, { recursive: true, force: true }); });

  async function catalogManifest(entries: Record<string, string[]>) {
    await mkdir(join(directory, 'server/app'), { recursive: true });
    await mkdir(join(directory, 'static/chunks'), { recursive: true });
    await writeFile(join(directory, 'server/app/page_client-reference-manifest.js'),
      `globalThis.__RSC_MANIFEST = globalThis.__RSC_MANIFEST || {};\nglobalThis.__RSC_MANIFEST["/page"] = ${JSON.stringify({ entryJSFiles: entries })};`);
  }

  it('allows credential-denial patterns and the public poster host', async () => {
    await writeFile(join(directory, 'client.js'), 'const deny = /GOOGLE_GENERATIVE_AI_API_KEY|api_key\\s*=/; const poster = "https://image.tmdb.org/t/p/w342";');
    expect(await inspectClientBundle(directory)).toEqual({ filesScanned: 1, issues: [] });
  });

  it('finds configured credentials without echoing source or the credential', async () => {
    const syntheticSecret = 'synthetic-credential-for-test-only';
    await mkdir(join(directory, 'chunks'));
    await writeFile(join(directory, 'chunks', 'client.js'), `const value = "${syntheticSecret}";`);
    const result = await inspectClientBundle(directory, [syntheticSecret]);
    expect(result.issues).toEqual([{ file: join('chunks', 'client.js'), reason: 'Configured server credential in browser JavaScript' }]);
    expect(JSON.stringify(result)).not.toContain(syntheticSecret);
  });

  it('rejects a server data endpoint in a browser chunk', async () => {
    await writeFile(join(directory, 'client.js'), 'fetch("https://api.themoviedb.org/3/movie/popular");');
    expect((await inspectClientBundle(directory)).issues).toHaveLength(1);
  });

  it('does not pass an empty directory or a directory containing only server/source-map artifacts', async () => {
    await writeFile(join(directory, 'client.js.map'), '{}');
    await expect(inspectClientBundle(directory)).rejects.toThrow('No browser JavaScript');
  });

  it('checks deduplicated catalog entries but allows AI copy in a separate Discover chunk', async () => {
    await catalogManifest({ layout: ['static/chunks/catalog.js'], page: ['static/chunks/catalog.js'] });
    await writeFile(join(directory, 'static/chunks/catalog.js'), 'const home = "Menos rolagem.";');
    await writeFile(join(directory, 'static/chunks/discover.js'), 'const copy = { adultDeclaration: "adult-only" };');
    expect(await inspectCatalogEntry(directory)).toEqual({ filesScanned: 1, issues: [] });
  });

  it.each(['adultDeclaration', 'rateLimitShared', 'privacyTerms'])('rejects Discover-only %s in catalog entry chunks', async key => {
    await catalogManifest({ page: ['static/chunks/catalog.js'] });
    await writeFile(join(directory, 'static/chunks/catalog.js'), `const copy = { ${key}: "not-for-the-catalog" };`);
    expect((await inspectCatalogEntry(directory)).issues).toEqual([
      { file: 'static/chunks/catalog.js', reason: 'Discover-only copy in catalog entry JavaScript' },
    ]);
  });

  it('rejects missing entry data and does not execute unexpected manifest code', async () => {
    await catalogManifest({});
    await expect(inspectCatalogEntry(directory)).rejects.toThrow('No catalog entry JavaScript');
    await writeFile(join(directory, 'server/app/page_client-reference-manifest.js'), 'throw new Error("must-not-execute");');
    await expect(inspectCatalogEntry(directory)).rejects.toThrow('Unrecognized catalog client manifest');
  });

  it('rejects a catalog asset path outside the static chunk directory', async () => {
    await catalogManifest({ page: ['static/chunks/../../outside.js'] });
    await expect(inspectCatalogEntry(directory)).rejects.toThrow('Invalid catalog entry asset path');
  });
});
