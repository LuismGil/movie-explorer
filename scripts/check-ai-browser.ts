/** Default CLI runs offline only. Live use of the exported observer requires deliberate scope. */
import assert from 'node:assert/strict';
import { createServer } from 'node:http';
import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
import { build } from 'esbuild';
import { chromium, type Page } from 'playwright';
import { aiMessages as copy } from '../src/i18n/ai';
import { ndjson, progressEvents, resultEvent } from '../src/lib/ai/__tests__/fixtures';

/** Observe the real UI reader instead of depending on Playwright body retrieval. */
export async function observeAiBrowserAttempt(page: Page, timeoutMs = 45000) {
  const report = {
    posts: 0, duplicateBlocked: false, httpStatus: null as number | null,
    contentType: null as string | null, networkFailure: null as string | null,
    uiStatus: '', movies: 0, outcome: 'inconclusive',
    validatedResultThroughEof: false, observationError: null as string | null,
  };
  const api = new URL('/api/ai/search', page.url()).href;
  page.on('response', response => {
    if (response.url() === api && response.request().method() === 'POST') {
      // Preserve headers BEFORE waiting for completion, including on stream failure.
      report.httpStatus = response.status();
      report.contentType = response.headers()['content-type'] ?? null;
    }
  });
  page.on('requestfailed', request => {
    if (request.url() === api) report.networkFailure = request.failure()?.errorText ?? 'unknown';
  });
  await page.route(api, async route => {
    if (route.request().method() !== 'POST' || ++report.posts > 1) {
      report.duplicateBlocked = true;
      await route.abort();
    } else await route.continue();
  });
  try {
    const checkbox = page.getByRole('checkbox', { name: copy.adultDeclaration });
    assert.equal(await checkbox.isChecked(), false);
    assert.equal(await page.getByLabel(copy.label).isDisabled(), true);
    await checkbox.check();
    await page.getByLabel(copy.label).fill('Filmes parecidos com Inception');
    await page.getByRole('button', { name: copy.submit, exact: true }).click();
    const pendingTexts: string[] = [copy.idle, copy.connecting, ...Object.values(copy.stages)];
    await page.waitForFunction(texts => {
      const text = document.querySelector('[role="status"]')?.textContent?.trim();
      return Boolean(text && !texts.includes(text));
    }, pendingTexts, { timeout: timeoutMs });
    report.uiStatus = (await page.getByRole('status').innerText()).trim();
    report.movies = await page.locator('article').count();
    const error = Object.entries(copy.errors).find(([, text]) => text === report.uiStatus)?.[0];
    report.validatedResultThroughEof = report.httpStatus === 200 && report.movies > 0
      && (report.uiStatus === copy.resultTitle || report.uiStatus === copy.selectionTitle);
    report.outcome = report.validatedResultThroughEof ? 'passed' : error ?? 'unsupported_or_empty';
  } catch (error) {
    report.observationError = error instanceof Error ? error.message : 'unknown';
    report.uiStatus = await page.getByRole('status').innerText({ timeout: 500 }).catch(() => 'unavailable');
  }
  return report;
}

async function offlineChecks() {
  const root = resolve(import.meta.dirname, '..');
  const bundled = await build({
    stdin: {
      contents: `import {createRoot} from 'react-dom/client';
        import {AIChatPanel} from './src/components/ai/AIChatPanel';
        createRoot(document.getElementById('root')).render(<AIChatPanel enabled />);`,
      resolveDir: root, loader: 'tsx',
    },
    absWorkingDir: root, outfile: '/virtual/panel.js', bundle: true, write: false,
    jsx: 'automatic', define: { 'process.env.NODE_ENV': '"production"' },
    plugins: [{ name: 'offline-link', setup(builder) {
      builder.onResolve({ filter: /^next\/link$/ }, () => ({ path: 'link', namespace: 'offline' }));
      builder.onLoad({ filter: /.*/, namespace: 'offline' }, () => ({
        contents: `import {createElement} from 'react';
          export default function Link(props) { return createElement('a', props); }`,
        resolveDir: root,
      }));
    } }],
  });
  const js = bundled.outputFiles.find(file => file.path.endsWith('.js'))!.text;
  const css = bundled.outputFiles.find(file => file.path.endsWith('.css'))!.text;
  let scenario = 'success';
  let reachedResult!: () => void;
  let releaseEof!: () => void;
  let serverPosts = 0;
  const server = createServer((request, response) => {
    if (request.url === '/panel.js') { response.setHeader('Content-Type', 'text/javascript'); response.end(js); return; }
    if (request.url === '/panel.css') { response.setHeader('Content-Type', 'text/css'); response.end(css); return; }
    if (request.url !== '/api/ai/search') {
      response.end('<!doctype html><html lang="pt-BR"><link rel="stylesheet" href="/panel.css"><div id="root"></div><script src="/panel.js"></script></html>');
      return;
    }
    serverPosts++;
    response.setHeader('Content-Type', 'application/x-ndjson');
    if (scenario === 'rate-limit') {
      response.writeHead(429, { 'Retry-After': '60' });
      response.end(ndjson([{ type: 'error', code: 'rate_limited' }]));
    } else if (scenario === 'startup-error') {
      response.end(ndjson([progressEvents[0], { type: 'error', code: 'unavailable' }]));
    } else if (scenario === 'transport-error') {
      response.write(ndjson([progressEvents[0]]));
      setTimeout(() => response.destroy(), 100);
    } else if (scenario === 'truncated') {
      response.end(ndjson(progressEvents));
    } else if (scenario === 'delayed-eof') {
      response.write(ndjson([...progressEvents, resultEvent]));
      releaseEof = () => response.end();
      reachedResult();
    } else response.end(ndjson([...progressEvents, resultEvent]));
  });
  await new Promise<void>(done => server.listen(0, '127.0.0.1', done));
  const address = server.address();
  assert(address && typeof address !== 'string');
  const origin = `http://127.0.0.1:${address.port}`;
  const browser = await chromium.launch({ headless: true });
  try {
    for (const [name, expected] of [
      ['success', 'passed'], ['delayed-eof', 'passed'], ['rate-limit', 'rate_limited'],
      ['startup-error', 'unavailable'], ['truncated', 'invalid_stream'], ['transport-error', 'invalid_stream'],
    ]) {
      scenario = name;
      const before = serverPosts;
      const context = await browser.newContext({ serviceWorkers: 'block' });
      await context.route('**/*', route => new URL(route.request().url()).origin === origin
        ? route.continue() : route.abort());
      const page = await context.newPage();
      await page.goto(origin);
      await page.getByRole('checkbox').waitFor();
      const written = new Promise<void>(done => { reachedResult = done; });
      let finished = false;
      const attempt = observeAiBrowserAttempt(page, 5000).then(report => { finished = true; return report; });
      if (name === 'delayed-eof') {
        await written;
        await page.waitForFunction(() => document.querySelector('[aria-current="step"]')?.textContent === 'Conferindo dados');
        assert.equal(finished, false, 'must not accept a result before EOF');
        assert.equal(await page.locator('article').count(), 0);
        releaseEof();
      }
      const report = await attempt;
      // Print diagnostics before assertions or cleanup can fail.
      console.log(JSON.stringify({ scenario: name, ...report }));
      assert.equal(report.outcome, expected);
      assert.equal(report.posts, 1);
      assert.equal(serverPosts - before, 1);
      assert.equal(report.httpStatus, name === 'rate-limit' ? 429 : 200);
      assert.equal(report.duplicateBlocked, false);
      assert.equal(report.validatedResultThroughEof, expected === 'passed');
      await context.close();
    }
  } finally {
    server.closeAllConnections();
    await new Promise<void>(done => server.close(() => done()));
    await Promise.race([browser.close(), new Promise(done => setTimeout(done, 3000))]);
  }
}

if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) {
  // A stuck browser must not turn a failed check into another unbounded session.
  setTimeout(() => { console.error('Offline check watchdog exceeded'); process.exit(1); }, 60000).unref();
  offlineChecks().then(() => process.exit(0), error => { console.error(error); process.exit(1); });
}
