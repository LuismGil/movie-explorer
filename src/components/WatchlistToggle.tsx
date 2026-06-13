"use client";

import { useWatchlist } from '@/context/WatchlistContext';
import type { MovieListItem } from '@/types/movie';
import { messages } from '@/i18n';

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
      className="inline-flex items-center gap-2 rounded-full border border-slate-600 px-4 py-2 text-sm font-medium text-slate-100 hover:border-sky-500 hover:text-sky-400 focus-visible:ring-2 focus-visible:ring-sky-400 focus-visible:outline-none"
    >
      {inWatchlist ? messages.watchlist.remove : messages.watchlist.add}
    </button>
  );
}

export default WatchlistToggle;
