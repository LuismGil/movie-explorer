"use client";

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams, usePathname } from 'next/navigation';
import { messages } from '@/i18n';

export function SearchBar() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  // Read current parameters from URL
  const queryParam = searchParams.get('query') || '';
  const viewParam = (searchParams.get('view') as 'popular' | 'trending') || 'popular';
  const windowParam = (searchParams.get('window') as 'day' | 'week') || 'day';

  const [search, setSearch] = useState(queryParam);

  // Sync input value with URL changes
  useEffect(() => {
    setSearch(queryParam);
  }, [queryParam]);

  // Debounce search input changes
  useEffect(() => {
    const timeout = setTimeout(() => {
      const params = new URLSearchParams(searchParams.toString());
      if (search.trim()) {
        params.set('query', search.trim());
        params.set('page', '1');
        params.delete('view');
        params.delete('window');
      } else {
        // If query is cleared, revert to popular view
        if (queryParam) {
          params.delete('query');
          params.set('view', 'popular');
          params.set('page', '1');
        }
      }
      router.push(`${pathname}?${params.toString()}`);
    }, 500);

    return () => clearTimeout(timeout);
  }, [search, router, pathname, searchParams, queryParam]);

  const setViewMode = (mode: 'popular' | 'trending') => {
    const params = new URLSearchParams();
    params.set('view', mode);
    params.set('page', '1');
    if (mode === 'trending') {
      params.set('window', 'day');
    }
    router.push(`${pathname}?${params.toString()}`);
  };

  const setTrendingWindow = (window: 'day' | 'week') => {
    const params = new URLSearchParams();
    params.set('view', 'trending');
    params.set('window', window);
    params.set('page', '1');
    router.push(`${pathname}?${params.toString()}`);
  };

  const isSearchActive = queryParam.trim().length > 0;

  const title = isSearchActive
    ? messages.home.searchResultsTitle(queryParam)
    : viewParam === 'trending'
      ? windowParam === 'day'
        ? messages.home.trendingTodayTitle
        : messages.home.trendingWeekTitle
      : messages.home.popularTitle;

  return (
    <>
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div className="space-y-2">
          <h1 className="text-3xl font-semibold text-white">{title}</h1>
          <p className="text-slate-400">{messages.home.subtitle}</p>
        </div>
        <div className="w-full max-w-md">
          <label htmlFor="movie-search" className="sr-only">
            {messages.home.searchLabel}
          </label>
          <input
            type="text"
            id="movie-search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={messages.home.searchPlaceholder}
            className="w-full rounded-full border border-slate-700 bg-slate-900 px-4 py-2 text-sm text-slate-100 placeholder:text-slate-500 focus:border-sky-500 focus:outline-none focus:ring-1 focus:ring-sky-500 focus-visible:ring-2 focus-visible:ring-sky-400"
          />
        </div>
      </div>
      {!isSearchActive && (
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2 rounded-full border border-slate-800 bg-slate-900 p-1">
            <button
              type="button"
              onClick={() => setViewMode('popular')}
              className={`rounded-full px-3 py-1.5 text-xs font-semibold transition focus-visible:ring-2 focus-visible:ring-sky-400 focus-visible:outline-none ${
                viewParam === 'popular'
                  ? 'bg-sky-500 text-slate-950'
                  : 'text-slate-300 hover:text-white'
              }`}
            >
              {messages.home.popular}
            </button>
            <button
              type="button"
              onClick={() => setViewMode('trending')}
              className={`rounded-full px-3 py-1.5 text-xs font-semibold transition focus-visible:ring-2 focus-visible:ring-sky-400 focus-visible:outline-none ${
                viewParam === 'trending'
                  ? 'bg-sky-500 text-slate-950'
                  : 'text-slate-300 hover:text-white'
              }`}
            >
              {messages.home.trending}
            </button>
          </div>
          {viewParam === 'trending' && (
            <div className="flex items-center gap-2 rounded-full border border-slate-800 bg-slate-900 p-1">
              <button
                type="button"
                onClick={() => setTrendingWindow('day')}
                className={`rounded-full px-3 py-1.5 text-xs font-semibold transition focus-visible:ring-2 focus-visible:ring-sky-400 focus-visible:outline-none ${
                  windowParam === 'day'
                    ? 'bg-slate-800 text-slate-100'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                {messages.home.today}
              </button>
              <button
                type="button"
                onClick={() => setTrendingWindow('week')}
                className={`rounded-full px-3 py-1.5 text-xs font-semibold transition focus-visible:ring-2 focus-visible:ring-sky-400 focus-visible:outline-none ${
                  windowParam === 'week'
                    ? 'bg-slate-800 text-slate-100'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                {messages.home.week}
              </button>
            </div>
          )}
        </div>
      )}
    </>
  );
}

export default SearchBar;
