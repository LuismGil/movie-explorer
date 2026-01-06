import axios from 'axios';
import type {
  MovieCredits,
  MovieDetails,
  MovieListItem,
  MovieVideoResponse,
  TmdbPaginatedResponse,
} from '../types/movie';

const apiKey = import.meta.env.VITE_TMDB_API_KEY;

const tmdb = axios.create({
  baseURL: 'https://api.themoviedb.org/3',
  params: {
    api_key: apiKey,
    language: 'pt-BR',
  },
});

export async function fetchPopularMovies(
  page = 1,
): Promise<TmdbPaginatedResponse<MovieListItem>> {
  const { data } = await tmdb.get<TmdbPaginatedResponse<MovieListItem>>('/movie/popular', {
    params: { page },
  });
  return data;
}

export async function searchMovies(
  query: string,
  page = 1,
): Promise<TmdbPaginatedResponse<MovieListItem>> {
  const { data } = await tmdb.get<TmdbPaginatedResponse<MovieListItem>>('/search/movie', {
    params: { query, page },
  });
  return data;
}

export async function fetchMovieDetails(id: string): Promise<MovieDetails> {
  const { data } = await tmdb.get<MovieDetails>(`/movie/${id}`);
  return data;
}

export async function fetchMovieVideos(id: string): Promise<MovieVideoResponse> {
  const { data } = await tmdb.get<MovieVideoResponse>(`/movie/${id}/videos`);
  return data;
}

export async function fetchMovieCredits(id: string): Promise<MovieCredits> {
  const { data } = await tmdb.get<MovieCredits>(`/movie/${id}/credits`);
  return data;
}

export async function fetchSimilarMovies(
  id: string,
): Promise<TmdbPaginatedResponse<MovieListItem>> {
  const { data } = await tmdb.get<TmdbPaginatedResponse<MovieListItem>>(`/movie/${id}/similar`);
  return data;
}

export async function fetchTrendingMovies(
  timeWindow: 'day' | 'week',
  page = 1,
): Promise<TmdbPaginatedResponse<MovieListItem>> {
  const { data } = await tmdb.get<TmdbPaginatedResponse<MovieListItem>>(
    `/trending/movie/${timeWindow}`,
    {
      params: { page },
    },
  );
  return data;
}
