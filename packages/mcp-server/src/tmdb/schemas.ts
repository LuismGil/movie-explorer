import { z } from 'zod';

export const movieSummarySchema = z.object({
  id: z.number(),
  title: z.string(),
  overview: z.string(),
  poster_path: z.string().nullable(),
  release_date: z.string().optional(),
  vote_average: z.number().optional(),
});
export type MovieSummary = z.infer<typeof movieSummarySchema>;

export const movieDetailsSchema = movieSummarySchema.extend({
  genres: z.array(z.object({ id: z.number(), name: z.string() })).optional(),
  runtime: z.number().nullable().optional(),
});
export type MovieDetails = z.infer<typeof movieDetailsSchema>;

export const paginatedResponseSchema = z.object({
  page: z.number(),
  results: z.array(movieSummarySchema),
  total_pages: z.number(),
});
export type PaginatedResponse = z.infer<typeof paginatedResponseSchema>;

export const castMemberSchema = z.object({
  id: z.number(),
  name: z.string(),
  character: z.string(),
  profile_path: z.string().nullable(),
});
export type CastMember = z.infer<typeof castMemberSchema>;

export const crewMemberSchema = z.object({
  id: z.number(),
  name: z.string(),
  job: z.string(),
  department: z.string(),
});
export type CrewMember = z.infer<typeof crewMemberSchema>;

export const creditsResponseSchema = z.object({
  id: z.number(),
  cast: z.array(castMemberSchema),
  crew: z.array(crewMemberSchema),
});
export type CreditsResponse = z.infer<typeof creditsResponseSchema>;

// Input schemas for tools
export const searchMoviesInputSchema = z.object({
  query: z.string().trim().min(1).max(100),
  page: z.number().int().min(1).max(500).optional(),
});

export const getMovieDetailsInputSchema = z.object({
  movieId: z.string().regex(/^\d+$/).transform(s => parseInt(s, 10)),
});

export const getRecommendationsInputSchema = z.object({
  movieId: z.string().regex(/^\d+$/).transform(s => parseInt(s, 10)),
});

export const getTrendingInputSchema = z.object({
  window: z.enum(['day', 'week']).default('day'),
});

export const getCreditsInputSchema = z.object({
  movieId: z.string().regex(/^\d+$/).transform(s => parseInt(s, 10)),
});
