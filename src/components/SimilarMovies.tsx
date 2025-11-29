import type { MovieListItem } from '../types/movie';
import { MovieCard } from './MovieCard';

type SimilarMoviesProps = {
  movies: MovieListItem[];
};

export function SimilarMovies({ movies }: SimilarMoviesProps) {
  if (movies.length === 0) return null;

  return (
    <div className="space-y-3">
      <h3 className="text-lg font-semibold text-white">Filmes semelhantes</h3>
      <div className="flex gap-4 overflow-x-auto pb-2 snap-x">
        {movies.map((movie) => (
          <div key={movie.id} className="min-w-[180px] snap-center">
            <MovieCard movie={movie} />
          </div>
        ))}
      </div>
    </div>
  );
}

export default SimilarMovies;
