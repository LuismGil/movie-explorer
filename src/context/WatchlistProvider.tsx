"use client";

import { useEffect, useState, useSyncExternalStore, type ReactNode } from 'react';
import { type MovieListItem } from '@/types/movie';
import { WatchlistContext } from './WatchlistContext';

type WatchlistProviderProps = {
  children: ReactNode;
};

const WATCHLIST_STORAGE_KEY = 'movie-explorer:watchlist';
const EMPTY_WATCHLIST: MovieListItem[] = [];
const subscribeToHydration = () => () => {};

export function WatchlistProvider({ children }: WatchlistProviderProps) {
  // Match SSR during hydration before exposing the browser's saved movies.
  const isHydrated = useSyncExternalStore(subscribeToHydration, () => true, () => false);
  const [savedWatchlist, setWatchlist] = useState<MovieListItem[]>(() => {
    if (typeof window === 'undefined') return [];
    try {
      const stored = window.localStorage.getItem(WATCHLIST_STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed)) {
          return parsed;
        }
      }
    } catch (error) {
      console.warn('WatchlistProvider: Failed to parse watchlist from localStorage:', error);
    }
    return [];
  });
  const watchlist = isHydrated ? savedWatchlist : EMPTY_WATCHLIST;

  useEffect(() => {
    if (isHydrated) {
      localStorage.setItem(WATCHLIST_STORAGE_KEY, JSON.stringify(savedWatchlist));
    }
  }, [isHydrated, savedWatchlist]);

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
