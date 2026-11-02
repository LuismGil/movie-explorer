'use client';

import { useSyncExternalStore } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import Link from 'next/link';
import { messages } from '@/i18n';

const subscribe = () => () => {};
const getOrigin = () => window.location.origin;
const serverOrigin = () => '';

export function QRDemo() {
  const origin = useSyncExternalStore(subscribe, getOrigin, serverOrigin);
  if (process.env.NODE_ENV !== 'production') return null;
  return <aside className="qr-demo glass" aria-labelledby="qr-title">
    <div className="qr-code" aria-busy={!origin}>
      {origin && <QRCodeSVG value={`${origin}/discover`} size={104} marginSize={4} level="M"
        title={messages.qr.codeTitle} role="img" />}
    </div>
    <div>
      <p className="cinema-eyebrow">{messages.qr.eyebrow}</p>
      <h2 id="qr-title">{messages.qr.title}</h2>
      <p>{messages.qr.description}</p>
    </div>
    <Link href="/discover" className="cinema-text-link">{messages.qr.link}<span aria-hidden="true">↗</span></Link>
  </aside>;
}
