import { aiDiscoveryEnabled } from '@/server/ai/availability';
import { createAiSearchHandler } from '@/server/ai/search-handler';
import { runOrchestrator } from '@/server/agents/orchestrator';

export const runtime = 'nodejs';
export const maxDuration = 35;
export const POST = createAiSearchHandler({
  enabled: aiDiscoveryEnabled,
  // Operator confirmed Free/no-payment and accepted Google data use. Public
  // availability remains false until audience/runtime release gates are closed.
  run: (input, options) => runOrchestrator(input, {
    ...options, google: { freeTierConfirmed: aiDiscoveryEnabled },
  }),
});
