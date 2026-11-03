import { readdir, readFile } from 'node:fs/promises';
import { join, relative, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const serverEndpoints = ['generativelanguage.googleapis.com', 'api.themoviedb.org/3', '.upstash.io'];
const discoverCopyKeys = ['adultDeclaration', 'rateLimitShared', 'privacyTerms'];

/** Report only paths/reasons, never matched source or credential values. */
export async function inspectClientBundle(directory, secrets = []) {
  let filesScanned = 0;
  const issues = [];
  const credentials = secrets.filter(value => typeof value === 'string' && value.length >= 16);
  async function visit(path) {
    for (const entry of await readdir(path, { withFileTypes: true })) {
      const file = join(path, entry.name);
      if (entry.isDirectory()) await visit(file);
      else if (entry.isFile() && entry.name.endsWith('.js')) {
        filesScanned++;
        const code = await readFile(file, 'utf8');
        if (credentials.some(value => code.includes(value))) {
          issues.push({ file: relative(directory, file), reason: 'Configured server credential in browser JavaScript' });
        }
        if (serverEndpoints.some(endpoint => code.includes(endpoint))) {
          issues.push({ file: relative(directory, file), reason: 'Server-only service endpoint in browser JavaScript' });
        }
      }
    }
  }
  await visit(directory);
  if (filesScanned === 0) throw new Error('No browser JavaScript found; build before checking.');
  return { filesScanned, issues };
}

/** Inspect only the catalog's declared entry chunks, without executing its manifest. */
export async function inspectCatalogEntry(directory) {
  const source = await readFile(join(directory, 'server/app/page_client-reference-manifest.js'), 'utf8');
  const assignment = source.match(/globalThis\.__RSC_MANIFEST\["\/page"\]\s*=\s*(\{[\s\S]*\})\s*;?\s*$/);
  if (!assignment) throw new Error('Unrecognized catalog client manifest; build or review the Next.js manifest format.');
  let manifest;
  try { manifest = JSON.parse(assignment[1]); }
  catch { throw new Error('Invalid catalog client manifest data.'); }
  const entries = Object.values(manifest?.entryJSFiles ?? {});
  if (!entries.length || entries.some(files => !Array.isArray(files) || !files.length)) {
    throw new Error('No catalog entry JavaScript found; build before checking.');
  }
  const files = [...new Set(entries.flat())];
  const issues = [];
  for (const file of files) {
    if (typeof file !== 'string' || !/^static\/chunks\/[\w./-]+\.js$/.test(file) || file.split('/').some(part => part === '.' || part === '..')) {
      throw new Error('Invalid catalog entry asset path.');
    }
    const code = await readFile(join(directory, file), 'utf8');
    if (discoverCopyKeys.some(key => code.includes(key))) {
      issues.push({ file, reason: 'Discover-only copy in catalog entry JavaScript' });
    }
  }
  return { filesScanned: files.length, issues };
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const keys = ['TMDB_API_KEY', 'GOOGLE_GENERATIVE_AI_API_KEY', 'MCP_INTERNAL_API_KEY', 'UPSTASH_REDIS_REST_TOKEN', 'AI_TELEMETRY_API_KEY'];
  const result = await inspectClientBundle(fileURLToPath(new URL('../.next/static/', import.meta.url)), keys.map(key => process.env[key]));
  const catalog = await inspectCatalogEntry(fileURLToPath(new URL('../.next/', import.meta.url)));
  const issues = [...result.issues, ...catalog.issues];
  console.log(JSON.stringify({ filesScanned: result.filesScanned, catalogEntryFilesScanned: catalog.filesScanned, issues }));
  if (issues.length) process.exitCode = 1;
}
