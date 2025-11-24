import { apiClient } from './api';
import type { Movie, MovieDetails, PaginatedResponse } from '../types';

const DEFAULT_PAGE = 1;

const withPage = (page?: number) => ({ page: page ?? DEFAULT_PAGE });

export const movieService = {
  async getPopularMovies(page?: number) {
    const { data } = await apiClient.get<PaginatedResponse<Movie>>('/movie/popular', {
      params: withPage(page),
    });
    return data;
  },

  async searchMovies(query: string, page?: number) {
    const { data } = await apiClient.get<PaginatedResponse<Movie>>('/search/movie', {
      params: {
        query,
        include_adult: false,
        ...withPage(page),
      },
    });
    return data;
  },

  async getMovieDetails(id: string | number) {
    const { data } = await apiClient.get<MovieDetails>(`/movie/${id}`, {
      params: { append_to_response: 'videos,credits' },
    });
    return data;
  },
};
