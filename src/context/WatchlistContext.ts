import { createContext, useContext } from 'react';
import { type MovieListItem } from '../types/movie';

export type WatchlistContextValue = {
  watchlist: MovieListItem[];
  isInWatchlist: (id: number) => boolean;
  toggleWatchlist: (movie: MovieListItem) => void;
};

export const WatchlistContext = createContext<WatchlistContextValue | undefined>(undefined);

export function useWatchlist() {
  const context = useContext(WatchlistContext);
  if (!context) {
    throw new Error('useWatchlist must be used within WatchlistProvider');
  }
  return context;
}
