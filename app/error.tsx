'use client';

import { ErrorBoundary } from '@/components/ErrorBoundary';

export default function ErrorPage({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  // Do not render/log raw server or provider errors in the branded fallback.
  return <ErrorBoundary reset={reset} />;
}
