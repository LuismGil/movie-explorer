import { Link } from 'react-router-dom';
import type { Movie } from '../types';

type MovieCardProps = {
  movie: Movie;
};

const TMDB_IMAGE_BASE = 'https://image.tmdb.org/t/p/w500';

const formatYear = (date: string) => date?.slice(0, 4) || '—';

export function MovieCard({ movie }: MovieCardProps) {
  const posterUrl = movie.poster_path ? `${TMDB_IMAGE_BASE}${movie.poster_path}` : null;

  return (
    <Link
      to={`/movie/${movie.id}`}
      className="group block overflow-hidden rounded-2xl border border-ink-800/80 bg-ink-900/70 shadow-lg shadow-black/20 transition hover:-translate-y-1 hover:border-accent-400/70 hover:shadow-accent-500/20"
    >
      <div className="relative aspect-[2/3] w-full overflow-hidden bg-gradient-to-br from-ink-800 via-ink-900 to-ink-950">
        {posterUrl ? (
          <img
            src={posterUrl}
            alt={movie.title}
            className="h-full w-full object-cover transition duration-700 group-hover:scale-105 group-hover:opacity-90"
            loading="lazy"
          />
        ) : (
          <div className="flex h-full items-center justify-center text-slate-500">
            <span>Sem imagem</span>
          </div>
        )}
        <div className="absolute left-3 top-3 rounded-full bg-black/70 px-3 py-1 text-xs font-semibold text-amber-200 backdrop-blur">
          ⭐ {movie.vote_average?.toFixed(1) ?? '—'}
        </div>
      </div>

      <div className="flex flex-col gap-1 px-4 py-3">
        <h3 className="line-clamp-2 font-display text-base font-semibold text-white group-hover:text-accent-300">
          {movie.title}
        </h3>
        <p className="text-sm text-slate-400">{formatYear(movie.release_date)}</p>
      </div>
    </Link>
  );
}
