"use client";

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { messages } from '@/i18n';

export function Header() {
  const pathname = usePathname();
  const isHomeActive = pathname === '/';
  const isWatchlistActive = pathname === '/watchlist';

  return (
    <header className="sticky top-0 z-20 border-b border-slate-800 bg-slate-950/80 backdrop-blur">
      <div className="mx-auto flex w-full max-w-6xl items-center justify-between gap-4 px-4 py-3">
        <Link href="/" className="text-lg font-semibold text-slate-100 transition hover:text-sky-400">
          <span aria-hidden="true">🎬</span> {messages.navigation.appTitle}
        </Link>
        <nav className="flex items-center gap-3">
          <Link
            href="/"
            aria-current={isHomeActive ? 'page' : undefined}
            className={`text-sm font-medium transition hover:text-sky-400 ${
              isHomeActive ? 'font-semibold text-sky-400' : 'text-slate-300'
            }`}
          >
            {messages.navigation.home}
          </Link>
          <Link
            href="/watchlist"
            aria-current={isWatchlistActive ? 'page' : undefined}
            className={`text-sm font-medium transition hover:text-sky-400 ${
              isWatchlistActive ? 'font-semibold text-sky-400' : 'text-slate-300'
            }`}
          >
            {messages.navigation.watchlist}
          </Link>
        </nav>
      </div>
    </header>
  );
}

export default Header;
