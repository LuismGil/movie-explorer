import { readdir, readFile } from 'node:fs/promises';
import { join, relative, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const serverEndpoints = ['generativelanguage.googleapis.com', 'api.themoviedb.org/3', '.upstash.io'];

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

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const keys = ['TMDB_API_KEY', 'GOOGLE_GENERATIVE_AI_API_KEY', 'MCP_INTERNAL_API_KEY', 'UPSTASH_REDIS_REST_TOKEN', 'AI_TELEMETRY_API_KEY'];
  const result = await inspectClientBundle(fileURLToPath(new URL('../.next/static/', import.meta.url)), keys.map(key => process.env[key]));
  console.log(JSON.stringify(result));
  if (result.issues.length) process.exitCode = 1;
}
