import { createRuntimeCheckHandler } from '@/server/ai/runtime-check';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 35;
export const POST = createRuntimeCheckHandler();
