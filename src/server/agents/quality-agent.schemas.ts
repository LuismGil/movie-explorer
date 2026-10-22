import 'server-only';
import { z } from 'zod';

/** Normalization only: render escaped text, never HTML or Markdown. */
export function sanitizeQualityText(value: string): string {
  return value
    .replace(/<(script|style|iframe|object)\b[^>]*>[\s\S]*?(?:<\/\1\s*>|$)/gi, ' ')
    .replace(/<[^>]*(?:>|$)/g, ' ')
    .replace(/[<>]/g, '')
    .replace(/[\p{Cc}\u202a-\u202e\u2066-\u2069]/gu, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

const credentialReference = /TMDB_API_KEY|MCP_INTERNAL_API_KEY|GOOGLE_GENERATIVE_AI_API_KEY|authorization\s*:\s*bearer|api_key\s*=|\bAIza[\w-]{30,}/i;
export const containsCredentialReference = (value: string): boolean => credentialReference.test(value);
const text = (max: number, min = 0) => z.string().min(min).max(max)
  .refine(value => value.length <= max && value === sanitizeQualityText(value) && !containsCredentialReference(value));
const id = z.number().int().positive();
export const qualityImagePathSchema = z.string().regex(/^\/[a-z\d_-]+\.(?:jpe?g|png|webp)$/i).nullable();
const person = z.strictObject({ id, name: text(500, 1) });
const genre = z.strictObject({ id, name: text(500, 1) });
const castMember = person.extend({ character: text(500), profile_path: qualityImagePathSchema });

export const qualityMovieSchema = z.strictObject({
  id,
  title: text(500, 1),
  overview: text(10000),
  poster_path: qualityImagePathSchema,
  release_date: z.iso.date().nullable(),
  vote_average: z.number().min(0).max(10).nullable(),
  genres: z.array(genre).max(30),
  runtime: z.number().int().nonnegative().nullable(),
  cast: z.array(castMember).max(10),
  director: person.nullable(),
});

const claimSchema = z.discriminatedUnion('field', [
  z.strictObject({ field: z.literal('title'), value: text(500, 1) }),
  z.strictObject({ field: z.literal('overview'), value: text(10000, 1) }),
  z.strictObject({ field: z.literal('release_date'), value: z.iso.date() }),
  z.strictObject({ field: z.literal('vote_average'), value: z.number().min(0).max(10) }),
  z.strictObject({ field: z.literal('runtime'), value: z.number().int().nonnegative() }),
  z.strictObject({ field: z.literal('genre'), value: genre }),
  z.strictObject({ field: z.literal('director'), value: person }),
  z.strictObject({ field: z.literal('cast_member'), value: castMember.omit({ profile_path: true }) }),
]);

export const qualityAgentProposalSchema = z.strictObject({
  movies: z.array(z.strictObject({
    movieId: id,
    claims: z.array(claimSchema).max(20).default([]),
  })).max(20),
});

const issueSchema = z.strictObject({
  code: z.enum([
    'invalid_evidence', 'invalid_proposal', 'search_unavailable', 'partial_search',
    'unsupported_movie', 'conflicting_evidence', 'unsupported_claim', 'contradictory_claim',
  ]),
  movieId: id.optional(),
  field: z.enum([
    'title', 'overview', 'release_date', 'vote_average', 'runtime', 'genre', 'director', 'cast_member',
  ]).optional(),
});

/** Only this allowlisted, validated DTO may be passed to the future AI UI. */
export const qualityAgentResultSchema = z.strictObject({
  status: z.enum(['approved', 'partial', 'empty', 'rejected', 'unavailable']),
  source: z.literal('tmdb'),
  movies: z.array(qualityMovieSchema).max(20),
  issues: z.array(issueSchema).max(21),
});

export type QualityMovie = z.infer<typeof qualityMovieSchema>;
export type QualityClaim = z.infer<typeof claimSchema>;
export type QualityIssue = z.infer<typeof issueSchema>;
export type QualityAgentResult = z.infer<typeof qualityAgentResultSchema>;
