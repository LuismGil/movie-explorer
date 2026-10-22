import 'server-only';
import { z } from 'zod';
import { qualityMovieSchema, qualityTextSchema as text } from '@/lib/ai/presentation';

export {
  containsCredentialReference, qualityAgentResultSchema, qualityImagePathSchema, qualityMovieSchema, sanitizeQualityText,
  type QualityAgentResult, type QualityIssue, type QualityMovie,
} from '@/lib/ai/presentation';

const id = z.number().int().positive();
const person = qualityMovieSchema.shape.director.unwrap();
const genre = qualityMovieSchema.shape.genres.element;
const castMember = qualityMovieSchema.shape.cast.element;

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

export type QualityClaim = z.infer<typeof claimSchema>;
