import 'server-only';

// One shared key across deployments. Never include visitor or request data.
export const AI_ADMISSION_KEY = 'movie-explorer:ai:admission:v1';
export const AI_ADMISSION_LIMITS = { intervalMs: 60_000, windowMs: 86_400_000, maximum: 10 } as const;

// EVAL is atomic on Redis. Use its clock, not clocks from separate Vercel instances.
// Store at most ten admission timestamps, including attempts whose pipeline later fails.
export const AI_ADMISSION_SCRIPT = `
local time = redis.call('TIME')
local now = tonumber(time[1]) * 1000 + math.floor(tonumber(time[2]) / 1000)
local interval = tonumber(ARGV[1])
local window = tonumber(ARGV[2])
local maximum = tonumber(ARGV[3])
redis.call('ZREMRANGEBYSCORE', KEYS[1], '-inf', now - window)
local count = redis.call('ZCARD', KEYS[1])
local wait = 0
if count > 0 then
  local last = redis.call('ZREVRANGE', KEYS[1], 0, 0, 'WITHSCORES')
  wait = math.max(wait, tonumber(last[2]) + interval - now)
end
if count >= maximum then
  local first = redis.call('ZRANGE', KEYS[1], 0, 0, 'WITHSCORES')
  wait = math.max(wait, tonumber(first[2]) + window - now)
end
if wait > 0 then
  return {0, math.ceil(wait / 1000)}
end
redis.call('ZADD', KEYS[1], now, string.format('%.0f', now))
redis.call('PEXPIRE', KEYS[1], window)
return {1, 0}
`;
