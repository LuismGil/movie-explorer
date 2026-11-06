'use client';

import { useEffect, useState } from 'react';
import { aiMessages } from '@/i18n/ai';
import styles from './AIChatPanel.module.css';

/** Mounted only during server-reported preparation; never warms or retries. */
export function AIStartupNotice() {
  const [slow, setSlow] = useState(false);
  useEffect(() => {
    const timer = setTimeout(() => setSlow(true), 8000);
    return () => clearTimeout(timer);
  }, []);
  if (!slow) return null;
  return <aside className={styles.notice}>
    <p>{aiMessages.startupWait}</p>
    <a href="/" className={`${styles.link} focus-visible:ring-2`}>{aiMessages.browse}</a>
  </aside>;
}
