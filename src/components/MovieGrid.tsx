import { MovieCard } from './MovieCard';
import { MovieCardSkeleton } from './MovieCardSkeleton';
import type { MovieListItem } from '@/types/movie';
import { messages } from '@/i18n';
import Link from 'next/link';

interface MovieGridProps {
  movies: MovieListItem[];
  isLoading: boolean;
}

export function MovieGrid({ movies, isLoading }: MovieGridProps) {
  if (isLoading) {
    return (
      <div className="movie-grid" role="status" aria-label={messages.common.loading}>
        {Array.from({ length: 8 }).map((_, index) => (
          <MovieCardSkeleton key={`skeleton-${index}`} />
        ))}
      </div>
    );
  }

  if (movies.length === 0) {
    return (
      <div className="cinema-empty glass">
        <p className="cinema-eyebrow">{messages.home.searchHint}</p>
        <h2>{messages.home.noMoviesFound}</h2>
        <p>{messages.home.emptyHint}</p>
        <Link href="/" className="cinema-button">{messages.common.backToCatalog}</Link>
      </div>
    );
  }

  return (
    <div className="movie-grid">
      {movies.map((movie, index) => (
        <MovieCard key={movie.id} movie={movie} index={index} eager={index < 4} />
      ))}
    </div>
  );
}

export default MovieGrid;
