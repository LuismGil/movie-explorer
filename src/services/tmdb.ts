import axios from 'axios';
import type { MovieDetails } from '../types/movie';

const axiosInstance = axios.create({
  baseURL: 'https://api.themoviedb.org/3',
  params: {
    api_key: import.meta.env.VITE_TMDB_API_KEY,
    language: 'pt-BR',
  },
});

export const fetchMovieDetails = async (id: string): Promise<MovieDetails> => {
  const { data } = await axiosInstance.get<MovieDetails>(`/movie/${id}`);
  return data;
};

export { axiosInstance };
