import React, { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import { type MovieListItem } from '../types/movie';

type WatchlistContextValue = {
  watchlist: MovieListItem[];
  isInWatchlist: (id: number) => boolean;
  toggleWatchlist: (movie: MovieListItem) => void;
};

type WatchlistProviderProps = {
  children: ReactNode;
};

const WATCHLIST_STORAGE_KEY = 'movie-explorer:watchlist';

export const WatchlistContext = createContext<WatchlistContextValue | undefined>(undefined);

export function WatchlistProvider({ children }: WatchlistProviderProps) {
  const [watchlist, setWatchlist] = useState<MovieListItem[]>([]);

  useEffect(() => {
    const stored = localStorage.getItem(WATCHLIST_STORAGE_KEY);
    if (!stored) return;

    try {
      const parsed = JSON.parse(stored);
      if (Array.isArray(parsed)) {
        setWatchlist(parsed);
      }
    } catch {
      // ignore malformed storage
    }
  }, []);

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

export function useWatchlist() {
  const context = useContext(WatchlistContext);
  if (!context) {
    throw new Error('useWatchlist must be used within WatchlistProvider');
  }
  return context;
}
