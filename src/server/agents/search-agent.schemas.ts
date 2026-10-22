import 'server-only';
import { z } from 'zod';

export const movieSummarySchema = z.object({
  id: z.number().int().positive(),
  title: z.string().min(1),
  overview: z.string(),
  poster_path: z.string().nullable(),
  release_date: z.string().optional(),
  vote_average: z.number().optional(),
});

export const movieDetailsSchema = movieSummarySchema.extend({
  genres: z.array(z.object({ id: z.number().int(), name: z.string() })).optional(),
  runtime: z.number().nullable().optional(),
});

export const creditsSchema = z.object({
  id: z.number().int().positive(),
  cast: z.array(z.object({
    id: z.number().int().positive(),
    name: z.string(),
    character: z.string(),
    profile_path: z.string().nullable(),
  })),
  director: z.object({
    id: z.number().int().positive(),
    name: z.string(),
    job: z.string(),
    department: z.string(),
  }).nullable(),
});

export const movieListSchema = z.object({ results: z.array(movieSummarySchema) });
export const movieSearchSchema = movieListSchema.extend({ total_pages: z.number().int().min(0) });

const movieIdSchema = z.string()
  .regex(/^\d+$/)
  .refine((value) => Number.isSafeInteger(Number(value)));

export const searchAgentCallSchema = z.discriminatedUnion('tool', [
  z.object({
    tool: z.literal('search_movies'),
    query: z.string().trim().min(1).max(100),
    page: z.number().int().min(1).max(500).optional(),
  }),
  z.object({ tool: z.literal('get_movie_details'), movieId: movieIdSchema }),
  z.object({ tool: z.literal('get_recommendations'), movieId: movieIdSchema }),
  z.object({ tool: z.literal('get_trending'), window: z.enum(['day', 'week']).optional() }),
  z.object({ tool: z.literal('get_credits'), movieId: movieIdSchema }),
]);

export const searchAgentPlanSchema = z.object({
  calls: z.array(searchAgentCallSchema).min(1).max(5),
});

const toolNameSchema = z.enum([
  'search_movies', 'get_movie_details', 'get_recommendations', 'get_trending', 'get_credits',
]);

export const searchAgentResultSchema = z.object({
  status: z.enum(['complete', 'partial', 'failed']),
  movies: z.array(movieSummarySchema),
  details: z.array(movieDetailsSchema),
  credits: z.array(creditsSchema),
  outcomes: z.array(z.discriminatedUnion('status', [
    z.object({
      callIndex: z.number().int().nonnegative(),
      tool: toolNameSchema,
      status: z.literal('succeeded'),
      itemCount: z.number().int().nonnegative(),
    }),
    z.object({
      callIndex: z.number().int().nonnegative(),
      tool: toolNameSchema,
      status: z.literal('failed'),
      reason: z.enum(['mcp_unavailable', 'tool_error', 'invalid_output', 'request_failed']),
    }),
  ])),
});

export type SearchAgentPlan = z.infer<typeof searchAgentPlanSchema>;
export type SearchAgentResult = z.infer<typeof searchAgentResultSchema>;
export type SearchAgentCall = z.infer<typeof searchAgentCallSchema>;
