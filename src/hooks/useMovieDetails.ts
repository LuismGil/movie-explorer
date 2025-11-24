import { useEffect, useState } from 'react';
import { movieService } from '../services/movieService';
import type { MovieDetails } from '../types';

type UseMovieDetailsResult = {
  data: MovieDetails | null;
  isLoading: boolean;
  error: string | null;
};

export function useMovieDetails(id?: string): UseMovieDetailsResult {
  const [data, setData] = useState<MovieDetails | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;

    const movieId = id;
    let isMounted = true;
    async function fetchDetails() {
      setIsLoading(true);
      setError(null);
      try {
        const details = await movieService.getMovieDetails(movieId);
        if (isMounted) {
          setData(details);
        }
      } catch (err) {
        if (isMounted) {
          setError('Não foi possível carregar os detalhes do filme.');
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    }

    fetchDetails();
    return () => {
      isMounted = false;
    };
  }, [id]);

  return { data, isLoading, error };
}
