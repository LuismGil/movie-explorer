export type MovieGenre = {
  id: number;
  name: string;
};

export type MovieDetails = {
  id: number;
  title: string;
  tagline: string | null;
  overview: string;
  vote_average: number;
  vote_count: number;
  runtime: number;
  release_date: string;
  backdrop_path: string | null;
  poster_path: string | null;
  homepage: string | null;
  genres: MovieGenre[];
};

export type TmdbPaginatedResponse<T> = {
  page: number;
  results: T[];
  total_pages: number;
  total_results: number;
};
