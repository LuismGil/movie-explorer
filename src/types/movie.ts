export type MovieGenre = {
  id: number;
  name: string;
};

export type MovieDetails = {
  id: number;
  title: string;
  tagline: string | null;
  overview: string | null;
  vote_average: number;
  vote_count: number;
  runtime: number | null;
  release_date: string;
  backdrop_path: string | null;
  poster_path: string | null;
  homepage: string | null;
  genres: MovieGenre[];
};

export type MovieListItem = {
  id: number;
  title: string;
  poster_path: string | null;
  vote_average: number;
  release_date: string;
};

export type TmdbPaginatedResponse<T> = {
  page: number;
  results: T[];
  total_pages: number;
  total_results: number;
};

export type MovieVideo = {
  id: string;
  key: string;
  name: string;
  site: string;
  type: string;
};

export type MovieCastMember = {
  id: number;
  name: string;
  character: string | null;
  profile_path: string | null;
};

export type MovieCrewMember = {
  id: number;
  name: string;
  job: string;
};

export type MovieCredits = {
  cast: MovieCastMember[];
  crew: MovieCrewMember[];
};

export type MovieVideoResponse = {
  id: number;
  results: MovieVideo[];
};

export type Movie = MovieListItem & {
  overview: string | null;
  backdrop_path: string | null;
  genre_ids?: number[];
};

export type PaginatedResponse<T> = TmdbPaginatedResponse<T>;
