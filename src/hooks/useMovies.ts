import { useEffect, useMemo, useState } from 'react';
import { movieService } from '../services/movieService';
import type { Movie, PaginatedResponse } from '../types';

type UseMoviesParams = {
  query?: string;
  page?: number;
};

type UseMoviesResult = {
  data: PaginatedResponse<Movie> | null;
  isLoading: boolean;
  error: string | null;
};

export function useMovies({ query = '', page = 1 }: UseMoviesParams): UseMoviesResult {
  const [data, setData] = useState<PaginatedResponse<Movie> | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const trimmedQuery = useMemo(() => query.trim(), [query]);

  useEffect(() => {
    let isMounted = true;
    async function fetchMovies() {
      setIsLoading(true);
      setError(null);
      try {
        const response = trimmedQuery
          ? await movieService.searchMovies(trimmedQuery, page)
          : await movieService.getPopularMovies(page);

        if (isMounted) {
          setData(response);
        }
      } catch (err) {
        if (isMounted) {
          setError('Não foi possível carregar os filmes. Tente novamente.');
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    }

    fetchMovies();
    return () => {
      isMounted = false;
    };
  }, [page, trimmedQuery]);

  return { data, isLoading, error };
}
