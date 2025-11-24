import axios from 'axios';

const API_KEY = import.meta.env.VITE_MOVIE_API_KEY as string | undefined;

const BASE_URL =
  (import.meta.env.VITE_MOVIE_API_URL as string | undefined) ||
  'https://api.themoviedb.org/3';

export const apiClient = axios.create({
  baseURL: BASE_URL,
  params: {
    api_key: API_KEY,
    language: 'en-US',
  },
});

apiClient.interceptors.request.use((config) => {
  if (!API_KEY) {
    console.warn('VITE_MOVIE_API_KEY is not set. Requests may fail.');
  }
  return config;
});
