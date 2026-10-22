import { AIChatPanel } from '@/components/ai/AIChatPanel';
import { aiDiscoveryEnabled } from '@/server/ai/availability';

export default function DiscoverPage() {
  return <AIChatPanel enabled={aiDiscoveryEnabled} />;
}
