import { aiDiscoveryEnabled } from '@/server/ai/availability';
import { AI_COUNTRY_HEADER, getAiRegionAccess } from '@/server/ai/region-policy';
import { createAiSearchHandler } from '@/server/ai/search-handler';
import { runOrchestrator } from '@/server/agents/orchestrator';
import { getMcpClient } from '@/server/mcp/client';

export const runtime = 'nodejs';
export const maxDuration = 35;
export const POST = createAiSearchHandler({
  enabled: aiDiscoveryEnabled,
  // Enforced before shared admission; never trust a client-provided country field.
  isAiRegionAllowed: request => getAiRegionAccess(request.headers.get(AI_COUNTRY_HEADER)) === 'allowed',
  // Operator authorized activation. Region, adult self-declaration and shared
  // admission are checked before preparation or Google receives any prompt.
  run: (input, options) => runOrchestrator(input, {
    ...options, google: { freeTierConfirmed: aiDiscoveryEnabled }, prepareSearch: getMcpClient,
  }),
});
