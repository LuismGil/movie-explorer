import { aiDiscoveryEnabled } from '@/server/ai/availability';
import { createAiSearchHandler } from '@/server/ai/search-handler';

export const runtime = 'nodejs';
export const maxDuration = 35;
export const POST = createAiSearchHandler({ enabled: aiDiscoveryEnabled });
