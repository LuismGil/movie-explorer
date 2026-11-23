import { appendFile, readdir, readFile } from 'node:fs/promises';
import { join } from 'node:path';

const directory = process.argv[2] ?? '.lighthouseci';
const files = await readdir(directory).catch(error => {
  if (error.code === 'ENOENT') return [];
  throw error;
});
const reports = files.filter(file => /^lhr-\d+\.json$/.test(file)).sort();

function isPoster({ resourceType, url }) {
  if (resourceType !== 'Image' || !URL.canParse(url)) return false;
  const { hostname, pathname } = new URL(url);
  return hostname === 'image.tmdb.org' && pathname.startsWith('/t/p/');
}

function milliseconds(value) {
  return Number.isFinite(value) ? `${value.toFixed(2)} ms` : 'unavailable';
}

if (reports.length === 0) {
  console.log('Lighthouse: no collected reports to summarize.');
}

for (const [index, file] of reports.entries()) {
  const { audits = {} } = JSON.parse(await readFile(join(directory, file), 'utf8'));
  const requests = audits['network-requests']?.details?.items;
  const posters = requests?.filter(isPoster);
  const loaded = posters?.filter(({ statusCode }) => statusCode >= 200 && statusCode < 300);
  const observed = posters === undefined
    ? 'network data unavailable'
    : `${posters.length} TMDB poster requests (${loaded.length} HTTP 2xx)`;
  const lcp = milliseconds(audits['largest-contentful-paint']?.numericValue);
  const ttfb = milliseconds(audits['server-response-time']?.numericValue);
  console.log(`Lighthouse run ${index + 1}: simulated LCP ${lcp}; observed document response ${ttfb}; ${observed}.`);
}

if (reports.length > 0) {
  console.log('If no posters were observed, inspect the matching report screenshot for the catalog state.');
}

if (files.includes('assertion-results.json')) {
  const assertions = JSON.parse(await readFile(join(directory, 'assertion-results.json'), 'utf8'));
  const lcp = assertions.find(result => result.auditId === 'largest-contentful-paint' &&
    result.level === 'warn' && result.passed === false && Number.isFinite(result.actual));
  if (lcp) {
    const message = `Simulated mobile LCP median: ${milliseconds(lcp.actual)}. Target: <1,200 ms (advisory, not met).`;
    if (process.env.GITHUB_ACTIONS === 'true') console.log(`::warning title=Lighthouse LCP target missed::${message}`);
    if (process.env.GITHUB_STEP_SUMMARY) {
      await appendFile(process.env.GITHUB_STEP_SUMMARY, `### Lighthouse performance\n\n${message}\n`);
    }
  }
}
