import { useEffect, useState } from 'react';
import type { MovieListItem } from '../types/movie';
import { fetchTrendingMovies } from '../services/tmdb';

type UseTrendingMoviesResult = {
  data: MovieListItem[];
  isLoading: boolean;
  error: string | null;
  page: number;
  totalPages: number;
  setPage: (page: number) => void;
};

export function useTrendingMovies(
  timeWindow: 'day' | 'week',
  initialPage = 1,
): UseTrendingMoviesResult {
  const [data, setData] = useState<MovieListItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(initialPage);
  const [totalPages, setTotalPages] = useState(1);

  useEffect(() => {
    let isMounted = true;
    async function load() {
      setIsLoading(true);
      setError(null);
      try {
        const response = await fetchTrendingMovies(timeWindow, page);
        if (!isMounted) return;
        setData(response.results);
        setTotalPages(response.total_pages);
      } catch (err) {
        if (!isMounted) return;
        setError('Nao foi possivel carregar os filmes em alta.');
        setData([]);
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    }

    load();
    return () => {
      isMounted = false;
    };
  }, [timeWindow, page]);

  return { data, isLoading, error, page, totalPages, setPage };
}

export default useTrendingMovies;
