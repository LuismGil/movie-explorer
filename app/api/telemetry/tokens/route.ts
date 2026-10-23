import { timingSafeEqual } from 'node:crypto';
import { getAiTelemetrySnapshot } from '@/server/telemetry/ai-metrics';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const headers = {
  'Cache-Control': 'private, no-store',
  'Content-Type': 'application/json; charset=utf-8',
  'X-Content-Type-Options': 'nosniff',
};

function authorized(request: Request, secret: string): boolean {
  const match = /^Bearer ([^\s]+)$/i.exec(request.headers.get('authorization') ?? '');
  if (!match) return false;
  const expected = Buffer.from(secret);
  const received = Buffer.from(match[1]);
  return expected.length === received.length && timingSafeEqual(expected, received);
}

export function GET(request: Request): Response {
  const secret = process.env.AI_TELEMETRY_API_KEY;
  if (!secret || secret.length < 32) {
    return Response.json({ error: 'unavailable' }, { status: 503, headers });
  }
  if (!authorized(request, secret)) {
    return Response.json({ error: 'unauthorized' }, { status: 401, headers });
  }

  return Response.json(getAiTelemetrySnapshot(), { headers });
}
