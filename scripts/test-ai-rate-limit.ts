import { execFileSync, spawnSync } from 'node:child_process';

const name = `movie-explorer-ai-limiter-test-${process.pid}`;
let created = false;
try {
  execFileSync('docker', ['run', '--rm', '-d', '--name', name, '--network', 'none', 'redis:7-alpine'], { stdio: 'pipe' });
  created = true;
  let ready = false;
  for (let attempt = 0; attempt < 20; attempt += 1) {
    try {
      ready = execFileSync('docker', ['exec', name, 'redis-cli', 'PING'], { encoding: 'utf8', stdio: 'pipe' }).trim() === 'PONG';
    } catch { /* Wait for the isolated Redis process to start. */ }
    if (ready) break;
    await new Promise(resolve => setTimeout(resolve, 100));
  }
  if (!ready) throw new Error('Local Redis did not become ready');
  const result = spawnSync(process.execPath, ['node_modules/vitest/vitest.mjs', 'run', 'src/server/ai/__tests__/rate-limit.redis.test.ts'], {
    stdio: 'inherit', env: { ...process.env, AI_RATE_LIMIT_TEST_REDIS_CONTAINER: name },
  });
  process.exitCode = result.status ?? 1;
} catch {
  console.error('Local Redis integration check failed. Ensure Docker is available; no hosted database or Google request was made.');
  process.exitCode = 1;
} finally {
  if (created) execFileSync('docker', ['stop', name], { stdio: 'pipe' });
}
