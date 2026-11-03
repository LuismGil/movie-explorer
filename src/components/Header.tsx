"use client";

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { catalogMessages as messages } from '@/i18n/catalog';
import { FilmMark } from './FilmMark';

export function Header() {
  const pathname = usePathname();
  const isHomeActive = pathname === '/';
  const isWatchlistActive = pathname === '/watchlist';
  const isDiscoverActive = pathname === '/discover';

  return (
    <header className="site-header">
      <div className="header-inner">
        <Link href="/" className="brand" aria-label={messages.navigation.appTitle}>
          <FilmMark />
          <span>{messages.navigation.appTitle}<span className="brand-tagline">{messages.navigation.tagline}</span></span>
        </Link>
        <nav className="main-nav" aria-label={messages.navigation.label}>
          <Link
            href="/"
            aria-current={isHomeActive ? 'page' : undefined}
            className="nav-link"
          >
            {messages.navigation.home}
          </Link>
          <Link href="/discover" aria-current={isDiscoverActive ? 'page' : undefined}
            className="nav-link nav-ai">
            {messages.navigation.discover}
          </Link>
          <Link
            href="/watchlist"
            aria-current={isWatchlistActive ? 'page' : undefined}
            className="nav-link"
          >
            {messages.navigation.watchlist}
          </Link>
        </nav>
      </div>
    </header>
  );
}

export default Header;
