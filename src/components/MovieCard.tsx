"use client";

import Link from 'next/link';
import type { CSSProperties } from 'react';
import type { MovieListItem } from '@/types/movie';
import { useWatchlist } from '@/context/WatchlistContext';
import { catalogMessages as messages } from '@/i18n/catalog';

type MovieCardProps = {
  movie: MovieListItem;
  index?: number;
  eager?: boolean;
};

const TMDB_POSTER_BASE = 'https://image.tmdb.org/t/p';

export function MovieCard({ movie, index = 0, eager = false }: MovieCardProps) {
  const year = movie.release_date ? movie.release_date.split('-')[0] : '—';
  const posterUrl = movie.poster_path ? `${TMDB_POSTER_BASE}/w342${movie.poster_path}` : null;
  const posterSrcSet = movie.poster_path
    ? [185, 342, 500].map(width => `${TMDB_POSTER_BASE}/w${width}${movie.poster_path} ${width}w`).join(', ')
    : undefined;
  const { isInWatchlist, toggleWatchlist } = useWatchlist();
  const inWatchlist = isInWatchlist(movie.id);
  const toggleLabel = inWatchlist ? messages.watchlist.removeAriaLabel(movie.title) : messages.watchlist.addAriaLabel(movie.title);

  return (
    <article className="movie-card glass cinema-reveal" style={{ '--reveal-delay': `${Math.min(index, 5) * 45}ms` } as CSSProperties}>
      <Link
        href={`/movie/${movie.id}`}
        className="movie-card-link"
      >
        <div className="movie-poster">
          {posterUrl ? (
            <img
              src={posterUrl}
              srcSet={posterSrcSet}
              sizes="(max-width: 640px) calc((100vw - 44px) / 2), (max-width: 900px) calc((100vw - 64px) / 3), (max-width: 1280px) calc((100vw - 152px) / 4), 282px"
              alt=""
              width={342}
              height={513}
              loading={eager ? 'eager' : 'lazy'}
            />
          ) : (
            <div className="poster-missing">
              <span aria-hidden="true">↗</span><span>{messages.common.noImage}</span>
            </div>
          )}
          <div className="movie-rating" aria-label={movie.vote_average > 0 ? messages.home.rating(movie.vote_average) : messages.home.noRating}>
            <span aria-hidden="true">★</span> {movie.vote_average > 0 ? movie.vote_average.toFixed(1) : '—'}
          </div>
        </div>
        <div className="movie-caption">
          <p className="movie-meta"><span>{year}</span><span aria-hidden="true">↗</span></p>
          <h2>
            {movie.title}
          </h2>
        </div>
      </Link>
      <button
        type="button"
        aria-label={toggleLabel}
        aria-pressed={inWatchlist}
        title={toggleLabel}
        onClick={(e) => {
          e.preventDefault();
          toggleWatchlist(movie);
        }}
        className="watchlist-button"
      >
        <span aria-hidden="true">{inWatchlist ? '♥' : '♡'}</span>
      </button>
    </article>
  );
}

export default MovieCard;
