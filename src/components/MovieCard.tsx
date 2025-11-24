import { Link } from 'react-router-dom';
import type { MovieListItem } from '../types/movie';

type MovieCardProps = {
  movie: MovieListItem;
};

const TMDB_POSTER_BASE = 'https://image.tmdb.org/t/p/w342';

export function MovieCard({ movie }: MovieCardProps) {
  const year = movie.release_date ? movie.release_date.split('-')[0] : '—';
  const posterUrl = movie.poster_path ? `${TMDB_POSTER_BASE}${movie.poster_path}` : null;

  return (
    <Link
      to={`/movie/${movie.id}`}
      className="group block overflow-hidden rounded-2xl border border-slate-800 bg-slate-900 shadow-md transition duration-200 hover:-translate-y-1 hover:shadow-lg"
    >
      <div className="relative aspect-[2/3] w-full overflow-hidden bg-slate-800">
        {posterUrl ? (
          <img
            src={posterUrl}
            alt={movie.title}
            className="h-full w-full object-cover transition duration-300 group-hover:scale-105"
            loading="lazy"
          />
        ) : (
          <div className="flex h-full items-center justify-center text-sm text-slate-300">
            Sem imagem
          </div>
        )}
        <div className="absolute left-2 top-2 rounded-full bg-black/70 px-3 py-1 text-xs font-semibold text-amber-200">
          ⭐ {movie.vote_average.toFixed(1)}
        </div>
      </div>
      <div className="flex flex-col gap-1 px-4 py-3">
        <h3 className="line-clamp-2 text-base font-semibold text-white group-hover:text-sky-300">
          {movie.title}
        </h3>
        <p className="text-sm text-slate-400">{year}</p>
      </div>
    </Link>
  );
}

export default MovieCard;
