import 'server-only';
import { buildQualityMovie, hasConsistentEvidence, qualityEvidenceSchema } from './quality-agent.evidence';
import {
  qualityAgentProposalSchema,
  qualityAgentResultSchema,
  type QualityAgentResult,
  type QualityClaim,
  type QualityIssue,
  type QualityMovie,
} from './quality-agent.schemas';

export { qualityAgentProposalSchema, qualityAgentResultSchema, type QualityAgentResult } from './quality-agent.schemas';

function claimFailure(movie: QualityMovie, claim: QualityClaim): QualityIssue['code'] | undefined {
  switch (claim.field) {
    case 'title':
    case 'overview':
    case 'release_date':
    case 'vote_average':
    case 'runtime': {
      const actual = movie[claim.field];
      if (actual === null || actual === '') return 'unsupported_claim';
      return actual === claim.value ? undefined : 'contradictory_claim';
    }
    case 'genre': {
      const actual = movie.genres.find(genre => genre.id === claim.value.id);
      if (!actual) return 'unsupported_claim';
      return actual.name === claim.value.name ? undefined : 'contradictory_claim';
    }
    case 'director': {
      if (!movie.director) return 'unsupported_claim';
      return movie.director.id === claim.value.id && movie.director.name === claim.value.name
        ? undefined : 'contradictory_claim';
    }
    case 'cast_member': {
      const actual = movie.cast.find(person => person.id === claim.value.id);
      if (!actual || (!actual.character && claim.value.character)) return 'unsupported_claim';
      return actual.name === claim.value.name && actual.character === claim.value.character
        ? undefined : 'contradictory_claim';
    }
  }
}

function result(
  status: QualityAgentResult['status'],
  movies: QualityMovie[],
  issues: QualityIssue[],
): QualityAgentResult {
  const parsed = qualityAgentResultSchema.safeParse({ status, source: 'tmdb', movies, issues });
  return parsed.success ? parsed.data : {
    status: 'rejected', source: 'tmdb', movies: [], issues: [{ code: 'invalid_evidence' }],
  };
}

/** Evidence must come from runSearchAgent server-side, never from a browser/model. */
export function runQualityAgent(evidence: unknown, input: unknown): QualityAgentResult {
  const parsedEvidence = qualityEvidenceSchema.safeParse(evidence);
  if (!parsedEvidence.success || !hasConsistentEvidence(parsedEvidence.data)) {
    return result('rejected', [], [{ code: 'invalid_evidence' }]);
  }
  const context = parsedEvidence.data;
  const parsedProposal = qualityAgentProposalSchema.safeParse(input);
  if (!parsedProposal.success) return result('rejected', [], [{ code: 'invalid_proposal' }]);
  if (context.status === 'failed') return result('unavailable', [], [{ code: 'search_unavailable' }]);

  const references = new Map(context.movies.map(movie => [movie.id, movie]));
  const details = new Map(context.details.map(movie => [movie.id, movie]));
  const credits = new Map(context.credits.map(movie => [movie.id, movie]));
  const selections = new Map<number, QualityClaim[]>();
  for (const selection of parsedProposal.data.movies) {
    selections.set(selection.movieId, [...(selections.get(selection.movieId) ?? []), ...selection.claims]);
  }

  const movies: QualityMovie[] = [];
  const issues: QualityIssue[] = context.status === 'partial' ? [{ code: 'partial_search' }] : [];
  for (const [movieId, claims] of selections) {
    const reference = references.get(movieId);
    if (!reference) {
      issues.push({ code: 'unsupported_movie', movieId });
      continue;
    }
    const approved = buildQualityMovie(reference, details.get(movieId), credits.get(movieId));
    if ('issue' in approved) {
      issues.push(approved.issue);
      continue;
    }
    let failedClaim: QualityIssue | undefined;
    for (const claim of claims) {
      const code = claimFailure(approved.movie, claim);
      if (code) {
        failedClaim = { code, movieId, field: claim.field };
        break;
      }
    }
    if (failedClaim) {
      issues.push(failedClaim);
      continue;
    }
    movies.push(approved.movie);
  }

  if (selections.size > 0 && movies.length === 0) return result('rejected', [], issues);
  if (issues.length > 0) return result('partial', movies, issues);
  return result(movies.length > 0 ? 'approved' : 'empty', movies, []);
}
