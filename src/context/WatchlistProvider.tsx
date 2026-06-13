"use client";

import { useEffect, useState, type ReactNode } from 'react';
import { type MovieListItem } from '@/types/movie';
import { WatchlistContext } from './WatchlistContext';

type WatchlistProviderProps = {
  children: ReactNode;
};

const WATCHLIST_STORAGE_KEY = 'movie-explorer:watchlist';

export function WatchlistProvider({ children }: WatchlistProviderProps) {
  const [watchlist, setWatchlist] = useState<MovieListItem[]>(() => {
    if (typeof window === 'undefined') return [];
    try {
      const stored = window.localStorage.getItem(WATCHLIST_STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed)) {
          return parsed;
        }
      }
    } catch {
      // ignore malformed storage
    }
    return [];
  });

  useEffect(() => {
    localStorage.setItem(WATCHLIST_STORAGE_KEY, JSON.stringify(watchlist));
  }, [watchlist]);

  const isInWatchlist = (id: number) => watchlist.some((movie) => movie.id === id);

  const toggleWatchlist = (movie: MovieListItem) => {
    setWatchlist((prev) =>
      prev.some((item) => item.id === movie.id)
        ? prev.filter((item) => item.id !== movie.id)
        : [...prev, movie]
    );
  };

  return (
    <WatchlistContext.Provider value={{ watchlist, isInWatchlist, toggleWatchlist }}>
      {children}
    </WatchlistContext.Provider>
  );
}
