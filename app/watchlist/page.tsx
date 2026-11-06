"use client";

import { MovieCard } from '@/components/MovieCard';
import { useWatchlist } from '@/context/WatchlistContext';
import { catalogMessages as messages } from '@/i18n/catalog';
import { FilmMark } from '@/components/FilmMark';

export default function WatchlistPage() {
  const { watchlist } = useWatchlist();

  return (
    <div className="watchlist-page">
      <header className="collection-heading">
        <p className="cinema-eyebrow">{messages.watchlist.eyebrow}</p>
        <h1>{messages.watchlist.title}</h1>
        <p>{messages.watchlist.description}</p>
        <p className="collection-note">{messages.watchlist.localHint}</p>
      </header>

      {watchlist.length === 0 ? (
        <div className="cinema-empty glass">
          <FilmMark />
          <h2>{messages.watchlist.emptyTitle}</h2>
          <p>{messages.watchlist.empty}</p>
          <a href="/" className="cinema-button">{messages.common.backToCatalog}<span aria-hidden="true">↗</span></a>
        </div>
      ) : (
        <div className="movie-grid">
          {watchlist.map((movie, index) => (
            <MovieCard key={movie.id} movie={movie} index={index} />
          ))}
        </div>
      )}
    </div>
  );
}
