import { AIChatPanel } from '@/components/ai/AIChatPanel';
import { headers } from 'next/headers';
import { aiDiscoveryEnabled } from '@/server/ai/availability';
import { AI_COUNTRY_HEADER, getAiRegionAccess } from '@/server/ai/region-policy';

export default async function DiscoverPage() {
  const regionAccess = aiDiscoveryEnabled
    ? getAiRegionAccess((await headers()).get(AI_COUNTRY_HEADER))
    : 'allowed';
  const regionUnavailable = aiDiscoveryEnabled && regionAccess !== 'allowed';
  return <AIChatPanel enabled={aiDiscoveryEnabled && !regionUnavailable} regionUnavailable={regionUnavailable} />;
}
