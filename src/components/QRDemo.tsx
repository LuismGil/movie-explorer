'use client';

import { lazy, Suspense, useEffect, useRef, useState, useSyncExternalStore } from 'react';
import Link from 'next/link';
import { messages } from '@/i18n';

const subscribe = () => () => {};
const getOrigin = () => window.location.origin;
const serverOrigin = () => '';
const QRCodeSVG = lazy(() => import('qrcode.react').then(module => ({ default: module.QRCodeSVG })));

export function QRDemo() {
  const origin = useSyncExternalStore(subscribe, getOrigin, serverOrigin);
  const target = useRef<HTMLDivElement>(null);
  const [nearby, setNearby] = useState(false);
  useEffect(() => {
    if (process.env.NODE_ENV !== 'production' || !target.current) return;
    if (!('IntersectionObserver' in window)) {
      const timer = setTimeout(() => setNearby(true), 0);
      return () => clearTimeout(timer);
    }
    const observer = new IntersectionObserver(entries => {
      if (entries.some(entry => entry.isIntersecting)) { setNearby(true); observer.disconnect(); }
    }, { rootMargin: '200px' });
    observer.observe(target.current);
    return () => observer.disconnect();
  }, []);
  if (process.env.NODE_ENV !== 'production') return null;
  return <aside className="qr-demo glass" aria-labelledby="qr-title">
    <div className="qr-code" ref={target} aria-busy={!origin || !nearby}>
      {origin && nearby && <Suspense fallback={null}><QRCodeSVG value={`${origin}/discover`} size={104} marginSize={4} level="M"
        title={messages.qr.codeTitle} role="img" /></Suspense>}
    </div>
    <div>
      <p className="cinema-eyebrow">{messages.qr.eyebrow}</p>
      <h2 id="qr-title">{messages.qr.title}</h2>
      <p>{messages.qr.description}</p>
    </div>
    <Link href="/discover" className="cinema-text-link">{messages.qr.link}<span aria-hidden="true">↗</span></Link>
  </aside>;
}
