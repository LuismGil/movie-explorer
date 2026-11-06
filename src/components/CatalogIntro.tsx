import Link from 'next/link';
import { catalogMessages as messages } from '@/i18n/catalog';

export function CatalogIntro() {
  const copy = messages.home;
  return <section className="catalog-intro" aria-labelledby="catalog-title">
    <div>
      <p className="cinema-eyebrow"><span className="cinema-dash" aria-hidden="true" />{copy.eyebrow}</p>
      <h1 id="catalog-title">{copy.heroTitle}<br /><span>{copy.heroAccent}</span></h1>
    </div>
    <div className="intro-aside">
      <p>{copy.heroDescription}</p>
      <div className="cinema-actions">
        <a href="#catalog" className="cinema-button">{copy.heroAction}<span aria-hidden="true">↓</span></a>
        <Link href="/discover" prefetch={false} className="cinema-text-link">{copy.aiAction}<span aria-hidden="true">↗</span></Link>
      </div>
      <p className="intro-fineprint">{copy.aiHint}</p>
    </div>
  </section>;
}
