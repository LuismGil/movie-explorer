import { MovieCard } from './MovieCard';
import { MovieCardSkeleton } from './MovieCardSkeleton';
import type { MovieListItem } from '@/types/movie';
import { messages } from '@/i18n';

interface MovieGridProps {
  movies: MovieListItem[];
  isLoading: boolean;
}

export function MovieGrid({ movies, isLoading }: MovieGridProps) {
  if (isLoading) {
    return (
      <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
        {Array.from({ length: 8 }).map((_, index) => (
          <MovieCardSkeleton key={`skeleton-${index}`} />
        ))}
      </div>
    );
  }

  if (movies.length === 0) {
    return (
      <div className="rounded-2xl border border-slate-800 bg-slate-900 px-6 py-10 text-center text-slate-200">
        {messages.home.noMoviesFound}
      </div>
    );
  }

  return (
    <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
      {movies.map((movie) => (
        <MovieCard key={movie.id} movie={movie} />
      ))}
    </div>
  );
}

export default MovieGrid;
