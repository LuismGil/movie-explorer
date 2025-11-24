import { useEffect, useState } from 'react';
import { fetchMovieDetails } from '../services/tmdb';
import type { MovieDetails } from '../types/movie';

type UseMovieDetailsResult = {
  data: MovieDetails | null;
  isLoading: boolean;
  error: string | null;
};

export function useMovieDetails(id?: string): UseMovieDetailsResult {
  const [data, setData] = useState<MovieDetails | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;

    let isMounted = true;
    async function loadDetails() {
      setIsLoading(true);
      setError(null);
      try {
        const details = await fetchMovieDetails(id);
        if (isMounted) {
          setData(details);
        }
      } catch (err) {
        if (isMounted) {
          setError('Não foi possível carregar os detalhes do filme. Tente novamente.');
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    }

    loadDetails();
    return () => {
      isMounted = false;
    };
  }, [id]);

  return { data, isLoading, error };
}
