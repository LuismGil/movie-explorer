// @vitest-environment node
import { mkdtemp, mkdir, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { inspectClientBundle } from '../../scripts/check-client-bundle.mjs';

describe('scoped browser bundle boundary check', () => {
  let directory: string;
  beforeEach(async () => { directory = await mkdtemp(join(tmpdir(), 'movie-explorer-bundle-')); });
  afterEach(async () => { await rm(directory, { recursive: true, force: true }); });

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
});
