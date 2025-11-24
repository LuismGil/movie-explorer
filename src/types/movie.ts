export type Genre = {
  id: number;
  name: string;
};

export type Movie = {
  id: number;
  title: string;
  overview: string;
  poster_path: string | null;
  backdrop_path?: string | null;
  release_date: string;
  vote_average: number;
  vote_count?: number;
  genre_ids?: number[];
};

export type MovieDetails = Movie & {
  genres: Genre[];
  runtime: number;
  tagline?: string | null;
  homepage?: string | null;
  imdb_id?: string | null;
};

export type PaginatedResponse<T> = {
  page: number;
  results: T[];
  total_pages: number;
  total_results: number;
};
