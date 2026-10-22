import 'server-only';
import { z } from 'zod';
import {
  creditsSchema,
  movieDetailsSchema,
  movieSummarySchema,
  searchAgentResultSchema,
  type SearchAgentResult,
} from './search-agent.schemas';
import {
  qualityImagePathSchema,
  qualityMovieSchema,
  sanitizeQualityText,
  type QualityIssue,
  type QualityMovie,
} from './quality-agent.schemas';

const boundedMovieSchema = movieSummarySchema.extend({
  title: movieSummarySchema.shape.title.max(500),
  overview: movieSummarySchema.shape.overview.max(10000),
  poster_path: movieSummarySchema.shape.poster_path.unwrap().max(1000).nullable(),
  release_date: movieSummarySchema.shape.release_date.unwrap().max(10).optional(),
});
const genreSchema = movieDetailsSchema.shape.genres.unwrap().element;
const castSchema = creditsSchema.shape.cast.element;
const directorSchema = creditsSchema.shape.director.unwrap();

export const qualityEvidenceSchema = searchAgentResultSchema.extend({
  movies: z.array(boundedMovieSchema).max(100),
  details: z.array(movieDetailsSchema.extend({
    ...boundedMovieSchema.shape,
    genres: z.array(genreSchema.extend({ name: genreSchema.shape.name.max(500) })).max(30).optional(),
  })).max(5),
  credits: z.array(creditsSchema.extend({
    cast: z.array(castSchema.extend({
      name: castSchema.shape.name.max(500),
      character: castSchema.shape.character.max(500),
      profile_path: castSchema.shape.profile_path.unwrap().max(1000).nullable(),
    })).max(10),
    director: directorSchema.extend({
      name: directorSchema.shape.name.max(500),
      job: directorSchema.shape.job.max(100),
      department: directorSchema.shape.department.max(100),
    }).nullable(),
  })).max(5),
  outcomes: searchAgentResultSchema.shape.outcomes.min(1).max(5),
});

const uniqueIds = (items: { id: number }[]) => new Set(items.map(item => item.id)).size === items.length;
const presentationSummarySchema = qualityMovieSchema.pick({
  id: true, title: true, overview: true, poster_path: true, release_date: true, vote_average: true,
});

export function hasConsistentEvidence(context: SearchAgentResult): boolean {
  const { outcomes, movies, details, credits } = context;
  const failures = outcomes.filter(outcome => outcome.status === 'failed').length;
  const expected = failures === 0 ? 'complete' : failures === outcomes.length ? 'failed' : 'partial';
  if (context.status !== expected || !uniqueIds(movies) || !uniqueIds(details) || !uniqueIds(credits)) return false;
  if (new Set(outcomes.map(outcome => outcome.callIndex)).size !== outcomes.length) return false;
  if (outcomes.some(outcome => outcome.callIndex >= outcomes.length)) return false;

  let movieCount = 0;
  let detailCount = 0;
  let creditsCount = 0;
  for (const outcome of outcomes) {
    if (outcome.status !== 'succeeded') continue;
    if (outcome.itemCount > 20) return false;
    if (outcome.tool === 'get_credits') creditsCount += outcome.itemCount;
    else movieCount += outcome.itemCount;
    if (outcome.tool === 'get_movie_details') detailCount += outcome.itemCount;
  }
  const movieIds = new Set(movies.map(movie => movie.id));
  return movies.length <= movieCount && details.length <= detailCount && credits.length <= creditsCount
    && details.every(detail => movieIds.has(detail.id));
}

function imagePath(value: string | null): string | null {
  const parsed = qualityImagePathSchema.safeParse(value);
  return parsed.success ? parsed.data : null;
}

function summary(movie: SearchAgentResult['movies'][number]) {
  return {
    id: movie.id,
    title: sanitizeQualityText(movie.title),
    overview: sanitizeQualityText(movie.overview),
    poster_path: imagePath(movie.poster_path),
    release_date: movie.release_date || null,
    vote_average: movie.vote_average ?? null,
  };
}

export function buildQualityMovie(
  movie: SearchAgentResult['movies'][number],
  detail: SearchAgentResult['details'][number] | undefined,
  credits: SearchAgentResult['credits'][number] | undefined,
): { movie: QualityMovie } | { issue: QualityIssue } {
  const base = summary(movie);
  if (!presentationSummarySchema.safeParse(base).success) {
    return { issue: { code: 'invalid_evidence', movieId: movie.id } };
  }
  if (detail) {
    const detailed = summary(detail);
    if (!presentationSummarySchema.safeParse(detailed).success) {
      return { issue: { code: 'invalid_evidence', movieId: movie.id } };
    }
    for (const key of ['title', 'overview', 'poster_path', 'release_date', 'vote_average'] as const) {
      const left = base[key];
      const right = detailed[key];
      if (left !== null && left !== '' && right !== null && right !== '' && left !== right) {
        return { issue: { code: 'conflicting_evidence', movieId: movie.id } };
      }
    }
    base.overview ||= detailed.overview;
    base.poster_path ??= detailed.poster_path;
    base.release_date ??= detailed.release_date;
    base.vote_average ??= detailed.vote_average;
  }
  if ((detail?.genres && !uniqueIds(detail.genres)) || (credits && !uniqueIds(credits.cast))) {
    return { issue: { code: 'conflicting_evidence', movieId: movie.id } };
  }
  if (credits?.director && credits.director.job !== 'Director') {
    return { issue: { code: 'conflicting_evidence', movieId: movie.id } };
  }

  const parsed = qualityMovieSchema.safeParse({
    ...base,
    genres: (detail?.genres ?? []).map(genre => ({ id: genre.id, name: sanitizeQualityText(genre.name) })),
    runtime: detail?.runtime ?? null,
    cast: (credits?.cast ?? []).map(person => ({
      id: person.id,
      name: sanitizeQualityText(person.name),
      character: sanitizeQualityText(person.character),
      profile_path: imagePath(person.profile_path),
    })),
    director: credits?.director ? {
      id: credits.director.id,
      name: sanitizeQualityText(credits.director.name),
    } : null,
  });
  return parsed.success
    ? { movie: parsed.data }
    : { issue: { code: 'invalid_evidence', movieId: movie.id } };
}
