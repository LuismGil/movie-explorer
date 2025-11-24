import { useEffect, useState } from 'react';
import type { MovieListItem } from '../types/movie';
import { fetchPopularMovies, searchMovies } from '../services/tmdb';

type UseMoviesResult = {
  data: MovieListItem[];
  isLoading: boolean;
  error: string | null;
  page: number;
  totalPages: number;
  setPage: (page: number) => void;
};

export function useMovies(query: string): UseMoviesResult {
  const [data, setData] = useState<MovieListItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  useEffect(() => {
    setPage(1);
  }, [query]);

  useEffect(() => {
    let isMounted = true;
    async function load() {
      setIsLoading(true);
      setError(null);
      try {
        const trimmed = query.trim();
        const response = trimmed
          ? await searchMovies(trimmed, page)
          : await fetchPopularMovies(page);
        if (!isMounted) return;
        setData(response.results);
        setTotalPages(response.total_pages);
      } catch (err) {
        if (!isMounted) return;
        setError('Não foi possível carregar os filmes.');
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
  }, [query, page]);

  return { data, isLoading, error, page, totalPages, setPage };
}
