"use client";

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams, usePathname } from 'next/navigation';
import { messages } from '@/i18n';

export function SearchBar() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const queryParam = searchParams.get('query') || '';
  const viewParam = (searchParams.get('view') as 'popular' | 'trending') || 'popular';
  const windowParam = (searchParams.get('window') as 'day' | 'week') || 'day';

  const [search, setSearch] = useState(queryParam);

  useEffect(() => {
    setSearch(queryParam);
  }, [queryParam]);

  useEffect(() => {
    if (search.trim() === queryParam.trim()) {
      return;
    }

    const timeout = setTimeout(() => {
      const params = new URLSearchParams(searchParams.toString());
      const trimmedSearch = search.trim();
      if (trimmedSearch) {
        params.set('query', trimmedSearch);
        params.set('page', '1');
        params.delete('view');
        params.delete('window');
      } else {
        params.delete('query');
        params.set('view', 'popular');
        params.set('page', '1');
      }
      router.push(`${pathname}?${params.toString()}`);
    }, 500);

    return () => clearTimeout(timeout);
  }, [search, queryParam, router, pathname, searchParams]);

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
      <div className="catalog-toolbar">
        <div>
          <p className="cinema-eyebrow">{messages.home.selection}</p>
          <h2 className="catalog-heading">{title}</h2>
        </div>
        <div className="catalog-search glass">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden="true"><circle cx="10.5" cy="10.5" r="6.5" stroke="currentColor" strokeWidth="1.5" /><path d="m16 16 5 5" stroke="currentColor" strokeWidth="1.5" /></svg>
          <label htmlFor="movie-search" className="sr-only">
            {messages.home.searchLabel}
          </label>
          <input
            type="text"
            id="movie-search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={messages.home.searchPlaceholder}
            className="catalog-search-input"
          />
          {search && <button type="button" className="clear-search" onClick={() => setSearch('')} aria-label={messages.home.clearSearch}>×</button>}
        </div>
      </div>
      {!isSearchActive && (
        <div className="catalog-filters">
          <div className="filter-group" role="group" aria-label={messages.home.selection}>
            <button
              type="button"
              onClick={() => setViewMode('popular')}
              aria-pressed={viewParam === 'popular'}
              className="filter-button"
            >
              {messages.home.popular}
            </button>
            <button
              type="button"
              onClick={() => setViewMode('trending')}
              aria-pressed={viewParam === 'trending'}
              className="filter-button"
            >
              {messages.home.trending}
            </button>
          </div>
          {viewParam === 'trending' && (
            <div className="filter-group filter-secondary" role="group" aria-label={messages.home.trending}>
              <button
                type="button"
                onClick={() => setTrendingWindow('day')}
                aria-pressed={windowParam === 'day'}
                className="filter-button"
              >
                {messages.home.today}
              </button>
              <button
                type="button"
                onClick={() => setTrendingWindow('week')}
                aria-pressed={windowParam === 'week'}
                className="filter-button"
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
