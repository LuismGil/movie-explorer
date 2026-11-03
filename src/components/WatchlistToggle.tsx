"use client";

import { useWatchlist } from '@/context/WatchlistContext';
import type { MovieListItem } from '@/types/movie';
import { catalogMessages as messages } from '@/i18n/catalog';

type WatchlistToggleProps = {
  movie: MovieListItem;
};

export function WatchlistToggle({ movie }: WatchlistToggleProps) {
  const { isInWatchlist, toggleWatchlist } = useWatchlist();
  const inWatchlist = isInWatchlist(movie.id);

  return (
    <button
      type="button"
      onClick={() => toggleWatchlist(movie)}
      aria-pressed={inWatchlist}
      className="pagination-button text-text-hi hover:border-accent hover:text-accent"
    >
      {inWatchlist ? messages.watchlist.remove : messages.watchlist.add}
    </button>
  );
}

export default WatchlistToggle;
