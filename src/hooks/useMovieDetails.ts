import { useEffect, useState } from 'react';
import {
  fetchMovieCredits,
  fetchMovieDetails,
  fetchMovieVideos,
  fetchSimilarMovies,
} from '../services/tmdb';
import type { MovieCastMember, MovieDetails, MovieListItem, MovieVideo } from '../types/movie';

type UseMovieDetailsResult = {
  data: MovieDetails | null;
  videos: MovieVideo[];
  cast: MovieCastMember[];
  director: string | null;
  similar: MovieListItem[];
  isLoading: boolean;
  error: string | null;
};

export function useMovieDetails(id?: string): UseMovieDetailsResult {
  const [data, setData] = useState<MovieDetails | null>(null);
  const [videos, setVideos] = useState<MovieVideo[]>([]);
  const [cast, setCast] = useState<MovieCastMember[]>([]);
  const [director, setDirector] = useState<string | null>(null);
  const [similar, setSimilar] = useState<MovieListItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!id) {
      setError('Filme não encontrado.');
      setData(null);
      setVideos([]);
      setCast([]);
      setDirector(null);
      setSimilar([]);
      return;
    }

    const movieId = id;
    let isMounted = true;
    async function load() {
      setIsLoading(true);
      setError(null);
      try {
        const [details, videosResponse, credits, similarResponse] = await Promise.all([
          fetchMovieDetails(movieId),
          fetchMovieVideos(movieId),
          fetchMovieCredits(movieId),
          fetchSimilarMovies(movieId),
        ]);

        if (!isMounted) return;

        const youtubeTrailers = videosResponse.results.filter(
          (video) => video.site === 'YouTube' && video.type === 'Trailer',
        );

        const mainCast = credits.cast.slice(0, 10);
        const directorName = credits.crew.find((member) => member.job === 'Director')?.name ?? null;

        setData(details);
        setVideos(youtubeTrailers);
        setCast(mainCast);
        setDirector(directorName);
        setSimilar(similarResponse.results);
      } catch (err) {
        if (!isMounted) return;
        setError('Não foi possível carregar os detalhes do filme.');
        setData(null);
        setVideos([]);
        setCast([]);
        setDirector(null);
        setSimilar([]);
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
  }, [id]);

  return { data, videos, cast, director, similar, isLoading, error };
}
