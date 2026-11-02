import { access, cp, mkdir } from 'node:fs/promises';

const root = new URL('../', import.meta.url);
const standalone = new URL('.next/standalone/', root);

await access(new URL('server.js', standalone));
await cp(new URL('.next/static/', root), new URL('.next/static/', standalone), { recursive: true });
await mkdir(new URL('public/', standalone), { recursive: true });

const publicDirectory = new URL('public/', root);
let hasPublicDirectory = true;
try {
  await access(publicDirectory);
} catch (error) {
  if (error.code !== 'ENOENT') throw error;
  hasPublicDirectory = false;
}
// An absent optional public directory must not break a standalone/Docker build.
if (hasPublicDirectory) {
  await cp(publicDirectory, new URL('public/', standalone), { recursive: true });
}

console.log('Standalone static/public assets prepared.');
