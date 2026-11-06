import { AIChatPanel } from '@/components/ai/AIChatPanel';
import { LoadingSpinner } from '@/components/LoadingSpinner';
import { headers } from 'next/headers';
import { aiDiscoveryEnabled } from '@/server/ai/availability';
import { AI_COUNTRY_HEADER, getAiRegionAccess } from '@/server/ai/region-policy';
import { Suspense } from 'react';

async function DiscoverChat() {
  const regionAccess = aiDiscoveryEnabled
    ? getAiRegionAccess((await headers()).get(AI_COUNTRY_HEADER))
    : 'allowed';
  const regionUnavailable = aiDiscoveryEnabled && regionAccess !== 'allowed';
  return <AIChatPanel enabled={aiDiscoveryEnabled && !regionUnavailable} regionUnavailable={regionUnavailable} />;
}

export default function DiscoverPage() {
  return (
    <Suspense fallback={<LoadingSpinner />}>
      <DiscoverChat />
    </Suspense>
  );
}
