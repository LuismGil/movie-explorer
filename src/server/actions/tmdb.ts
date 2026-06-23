"use server";

import axios from 'axios';
import type {
  MovieCredits,
  MovieDetails,
  MovieListItem,
  MovieVideoResponse,
  TmdbPaginatedResponse,
} from '@/types/movie';

const TMDB_BASE_URL = 'https://api.themoviedb.org/3';

// Reusable axios client configured server-side only to prevent leaking key to client
const tmdbClient = axios.create({
  baseURL: TMDB_BASE_URL,
  params: {
    language: 'pt-BR',
  },
});

tmdbClient.interceptors.request.use((config) => {
  const apiKey = process.env.TMDB_API_KEY;
  if (!apiKey) {
    throw new Error('Serviço indisponível: chave de API não configurada.');
  }
  config.params = {
    ...config.params,
    api_key: apiKey,
  };
  return config;
});

export async function fetchPopularMovies(
  page = 1,
): Promise<TmdbPaginatedResponse<MovieListItem>> {
  try {
    const { data } = await tmdbClient.get<TmdbPaginatedResponse<MovieListItem>>('/movie/popular', {
      params: { page },
    });
    return data;
  } catch (error) {
    console.error('fetchPopularMovies error:', error instanceof Error ? error.message : error);
    throw new Error('Erro ao buscar filmes populares.');
  }
}

export async function searchMovies(
  query: string,
  page = 1,
): Promise<TmdbPaginatedResponse<MovieListItem>> {
  if (!query || !query.trim()) {
    return { page: 1, results: [], total_pages: 1, total_results: 0 };
  }
  try {
    const { data } = await tmdbClient.get<TmdbPaginatedResponse<MovieListItem>>('/search/movie', {
      params: { query: query.trim(), page },
    });
    return data;
  } catch (error) {
    console.error('searchMovies error:', error instanceof Error ? error.message : error);
    throw new Error('Erro ao pesquisar filmes.');
  }
}

export async function fetchMovieDetails(id: string): Promise<MovieDetails> {
  try {
    const { data } = await tmdbClient.get<MovieDetails>(`/movie/${id}`);
    return data;
  } catch (error) {
    console.error(`fetchMovieDetails error for ID ${id}:`, error instanceof Error ? error.message : error);
    throw new Error('Erro ao buscar detalhes do filme.');
  }
}

export async function fetchMovieVideos(id: string): Promise<MovieVideoResponse> {
  try {
    const { data } = await tmdbClient.get<MovieVideoResponse>(`/movie/${id}/videos`);
    return data;
  } catch (error) {
    console.error(`fetchMovieVideos error for ID ${id}:`, error instanceof Error ? error.message : error);
    throw new Error('Erro ao buscar vídeos do filme.');
  }
}

export async function fetchMovieCredits(id: string): Promise<MovieCredits> {
  try {
    const { data } = await tmdbClient.get<MovieCredits>(`/movie/${id}/credits`);
    return data;
  } catch (error) {
    console.error(`fetchMovieCredits error for ID ${id}:`, error instanceof Error ? error.message : error);
    throw new Error('Erro ao buscar créditos do filme.');
  }
}

export async function fetchSimilarMovies(
  id: string,
): Promise<TmdbPaginatedResponse<MovieListItem>> {
  try {
    const { data } = await tmdbClient.get<TmdbPaginatedResponse<MovieListItem>>(`/movie/${id}/recommendations`);
    return data;
  } catch (error) {
    console.error(`fetchSimilarMovies error for ID ${id}:`, error instanceof Error ? error.message : error);
    throw new Error('Erro ao buscar filmes semelhantes.');
  }
}

export async function fetchTrendingMovies(
  timeWindow: 'day' | 'week',
  page = 1,
): Promise<TmdbPaginatedResponse<MovieListItem>> {
  try {
    const { data } = await tmdbClient.get<TmdbPaginatedResponse<MovieListItem>>(
      `/trending/movie/${timeWindow}`,
      {
        params: { page },
      },
    );
    return data;
  } catch (error) {
    console.error('fetchTrendingMovies error:', error instanceof Error ? error.message : error);
    throw new Error('Erro ao buscar filmes em destaque.');
  }
}
