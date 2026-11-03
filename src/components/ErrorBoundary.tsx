'use client';

import Link from 'next/link';
import { catalogMessages as messages } from '@/i18n/catalog';
import { FilmMark } from './FilmMark';

/** Presentational fallback for the App Router's real error boundary. */
export function ErrorBoundary({ reset }: { reset: () => void }) {
  return <section className="cinema-empty cinema-error glass" role="alert">
    <FilmMark />
    <p className="cinema-eyebrow">{messages.navigation.appTitle}</p>
    <h1>{messages.error.cinemaTitle}</h1>
    <p>{messages.error.cinemaDescription}</p>
    <div className="cinema-actions">
      <button type="button" className="cinema-button" onClick={reset}>{messages.error.retry}</button>
      <Link href="/" className="cinema-text-link">{messages.common.backToCatalog}</Link>
    </div>
  </section>;
}
