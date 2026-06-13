"use client";

import { MovieCard } from '@/components/MovieCard';
import { useWatchlist } from '@/context/WatchlistContext';
import { messages } from '@/i18n';

export default function WatchlistPage() {
  const { watchlist } = useWatchlist();

  return (
    <div className="space-y-4 py-8">
      <h1 className="mb-4 text-2xl font-semibold text-slate-50">{messages.watchlist.title}</h1>

      {watchlist.length === 0 ? (
        <p className="text-sm text-slate-300">
          {messages.watchlist.empty}
        </p>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
          {watchlist.map((movie) => (
            <MovieCard key={movie.id} movie={movie} />
          ))}
        </div>
      )}
    </div>
  );
}
