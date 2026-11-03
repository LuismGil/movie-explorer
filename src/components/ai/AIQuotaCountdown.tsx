'use client';

import { useEffect, useState } from 'react';
import { aiMessages } from '@/i18n/ai';

export function AIQuotaCountdown({ until }: { until: number }) {
  const [seconds, setSeconds] = useState(() => Math.max(0, Math.ceil((until - Date.now()) / 1000)));
  useEffect(() => {
    const update = () => setSeconds(Math.max(0, Math.ceil((until - Date.now()) / 1000)));
    const timer = setInterval(update, 1000);
    document.addEventListener('visibilitychange', update);
    return () => { clearInterval(timer); document.removeEventListener('visibilitychange', update); };
  }, [until]);

  // Keep changing digits outside the panel's live region: do not announce every second.
  return <p role="timer" aria-live="off">{aiMessages.rateLimitWait(seconds)}</p>;
}
