import assert from 'node:assert/strict';
import { execFileSync, spawn } from 'node:child_process';
import { existsSync, mkdtempSync, mkdirSync, readFileSync, readdirSync, renameSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { setTimeout as delay } from 'node:timers/promises';
import { chromium } from 'playwright';
import { startFixture } from './lighthouse-fixture.mjs';

const configPath = resolve('lighthouserc.json');
const { url: urls, numberOfRuns, settings } = JSON.parse(readFileSync(configPath)).ci.collect;
const url = new URL(urls[0]);
assert.equal(urls.length, 1);
assert.equal(url.hostname, 'localhost');
const reportRoot = resolve(process.env.LIGHTHOUSE_WORKSPACE ?? '.');
const reports = join(reportRoot, '.lighthouseci');
mkdirSync(reports, { recursive: true });
assert(!readdirSync(reports).some(name => /^lhr-|^assertion-results\.json$/.test(name)),
  'Refusing to mix Lighthouse reports: use a fresh LIGHTHOUSE_WORKSPACE.');

const chrome = chromium.executablePath();
const standalone = resolve(process.env.LIGHTHOUSE_STANDALONE ?? '.next/standalone/server.js');
assert(existsSync(standalone), 'Build and assemble the standalone app before running Lighthouse.');
console.log(`Lighthouse browser: ${execFileSync(chrome, ['--version'], { encoding: 'utf8' }).trim()}`);
const scratch = mkdtempSync(join(tmpdir(), 'movie-lighthouse-'));

function command(script, args, options) {
  return new Promise((done, reject) => {
    const child = spawn(process.execPath, [script, ...args], { ...options, stdio: 'inherit' });
    child.once('error', reject);
    child.once('exit', (code, signal) => code === 0 ? done() : reject(new Error(`${script}: ${signal ?? code}`)));
  });
}

let fixture;
let server;
let serverExited;
try {
  fixture = await startFixture(scratch);
  server = spawn(process.execPath, [standalone], {
    stdio: ['ignore', 'pipe', 'inherit'], env: {
      ...process.env, HOSTNAME: '127.0.0.1', PORT: url.port, TMDB_API_KEY: 'ci-lighthouse-fixture',
      HTTPS_PROXY: fixture.url, https_proxy: fixture.url, HTTP_PROXY: fixture.url, http_proxy: fixture.url,
      NO_PROXY: 'localhost,127.0.0.1', no_proxy: 'localhost,127.0.0.1', NODE_EXTRA_CA_CERTS: fixture.certificate,
    },
  });
  const ready = new Promise(resolveReady => {
    let output = '';
    server.stdout.on('data', chunk => {
      process.stdout.write(chunk);
      output = (output + chunk).slice(-2048);
      if (/\bReady in\b/.test(output)) resolveReady(true);
    });
  });
  serverExited = new Promise(done => {
    server.once('error', error => done(`Standalone server could not start: ${error.message}`));
    server.once('exit', (code, signal) => done(`Standalone server exited before it was ready (${signal ?? code}).`));
  });
  const startup = await Promise.race([ready, serverExited, delay(15000, 'Standalone readiness timed out.', { ref: false })]);
  assert(startup === true, startup);

  let fixtureValid = true;
  for (let run = 1; run <= numberOfRuns; run++) {
    const prefix = join(reports, `lhr-${run}`);
    const chromeFlags = `${settings.chromeFlags} --proxy-server=${fixture.url} --ignore-certificate-errors-spki-list=${fixture.fingerprint} --disable-quic`;
    await command(resolve('node_modules/.bin/lighthouse'), [
      url.href, '--quiet', '--output=json', '--output=html', `--output-path=${prefix}`, '--save-assets',
      `--form-factor=${settings.formFactor}`, `--throttling-method=${settings.throttlingMethod}`, `--chrome-flags=${chromeFlags}`,
    ], { cwd: reportRoot, env: { ...process.env, CHROME_PATH: chrome } });
    for (const extension of ['json', 'html']) renameSync(`${prefix}.report.${extension}`, `${prefix}.${extension}`);
    const { audits } = JSON.parse(readFileSync(`${prefix}.json`));
    const requests = audits['network-requests'].details.items;
    const images = requests.filter(item => /^https:\/\/image\.tmdb\.org\/t\/p\/w\d+\/fixture-\d+\.jpg$/.test(item.url));
    const external = requests.some(item => /^https?:/.test(item.url) &&
      new URL(item.url).origin !== url.origin && !images.includes(item));
    const valid = images.length >= 4 && images.every(item => item.statusCode === 200) && !external;
    fixtureValid &&= valid;
    console.log(`Measured run ${run}: ${images.length} fixture posters, catalog evidence ${valid ? 'valid' : 'invalid'}.`);
  }
  await command(resolve('node_modules/.bin/lhci'), ['assert', `--config=${configPath}`], { cwd: reportRoot });
  assert(fixtureValid, 'A run did not measure the populated offline catalog.');
} catch (error) {
  console.error(`Lighthouse gate failed: ${error.message}`);
  process.exitCode = 1;
} finally {
  if (server?.pid && server.exitCode === null && server.signalCode === null) {
    server.kill();
    if (!await Promise.race([serverExited.then(() => true), delay(2000, false, { ref: false })])) {
      server.kill('SIGKILL');
      await serverExited;
    }
  }
  fixture?.stop();
  rmSync(scratch, { recursive: true, force: true });
}
