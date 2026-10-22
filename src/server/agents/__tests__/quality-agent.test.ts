import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const { mockGetMcpClient } = vi.hoisted(() => ({ mockGetMcpClient: vi.fn() }));
vi.mock('../../mcp/client', () => ({ getMcpClient: mockGetMcpClient }));

import { runSearchAgent } from '../search-agent';
import { runQualityAgent, qualityAgentResultSchema } from '../quality-agent';
import type { SearchAgentResult } from '../search-agent.schemas';

const movie = {
  id: 27205,
  title: 'A Origem',
  overview: 'Uma missão dentro dos sonhos.',
  poster_path: '/poster.jpg',
  release_date: '2010-07-15',
  vote_average: 8.3,
};
const otherMovie = { ...movie, id: 42, title: 'Another Film' };
const detail = { ...movie, genres: [{ id: 878, name: 'Ficção científica' }], runtime: 148 };
const credits = {
  id: movie.id,
  cast: [{ id: 7, name: 'Actor', character: 'Cobb', profile_path: '/actor.jpg' }],
  director: { id: 9, name: 'Director', job: 'Director', department: 'Directing' },
};

function evidence(overrides: Partial<SearchAgentResult> = {}): SearchAgentResult {
  return {
    status: 'complete',
    movies: [movie, otherMovie],
    details: [detail],
    credits: [credits],
    outcomes: [
      { callIndex: 0, tool: 'search_movies', status: 'succeeded', itemCount: 2 },
      { callIndex: 1, tool: 'get_movie_details', status: 'succeeded', itemCount: 1 },
      { callIndex: 2, tool: 'get_credits', status: 'succeeded', itemCount: 1 },
    ],
    ...overrides,
  };
}

const selectMovie = { movies: [{ movieId: movie.id }] };

describe('runQualityAgent', () => {
  beforeEach(() => vi.resetAllMocks());
  afterEach(() => vi.restoreAllMocks());

  it('approves all supported claim kinds and rebuilds a validated TMDB presentation DTO', () => {
    const result = runQualityAgent(evidence(), { movies: [{
      movieId: movie.id,
      claims: [
        { field: 'title', value: movie.title },
        { field: 'overview', value: movie.overview },
        { field: 'release_date', value: movie.release_date },
        { field: 'vote_average', value: movie.vote_average },
        { field: 'runtime', value: detail.runtime },
        { field: 'genre', value: detail.genres[0] },
        { field: 'director', value: { id: 9, name: 'Director' } },
        { field: 'cast_member', value: { id: 7, name: 'Actor', character: 'Cobb' } },
      ],
    }] });

    expect(result.status).toBe('approved');
    expect(result.source).toBe('tmdb');
    expect(result.issues).toEqual([]);
    expect(result.movies).toEqual([{
      ...movie,
      runtime: 148,
      genres: detail.genres,
      cast: credits.cast,
      director: { id: 9, name: 'Director' },
    }]);
    expect(qualityAgentResultSchema.safeParse(result).success).toBe(true);
    expect(JSON.stringify(result)).not.toContain('department');
  });

  it('does not make network calls or open an MCP client', () => {
    const fetch = vi.spyOn(globalThis, 'fetch');
    runQualityAgent(evidence(), selectMovie);
    expect(fetch).not.toHaveBeenCalled();
    expect(mockGetMcpClient).not.toHaveBeenCalled();
  });

  it('accepts real Search Agent output without another tool call', async () => {
    const callTool = vi.fn().mockResolvedValue({
      content: [{ type: 'text', text: JSON.stringify({ results: [movie], total_pages: 1 }) }],
    });
    mockGetMcpClient.mockResolvedValue({ callTool });
    const search = await runSearchAgent({ calls: [{ tool: 'search_movies', query: 'Inception' }] });
    const result = runQualityAgent(search, selectMovie);

    expect(result.status).toBe('approved');
    expect(result.movies[0].id).toBe(movie.id);
    expect(callTool).toHaveBeenCalledTimes(1);
    expect(mockGetMcpClient).toHaveBeenCalledTimes(1);
  });

  it('deduplicates selections in order without mutating evidence or proposals', () => {
    const context = evidence();
    const proposal = { movies: [{ movieId: 42 }, { movieId: movie.id }, { movieId: 42 }] };
    const before = JSON.stringify({ context, proposal });
    const result = runQualityAgent(context, proposal);
    expect(result.movies.map(item => item.id)).toEqual([42, movie.id]);
    expect(JSON.stringify({ context, proposal })).toBe(before);
  });

  it('rejects a contradictory claim hidden in a duplicate selection but retains other movies', () => {
    const result = runQualityAgent(evidence(), { movies: [
      { movieId: movie.id },
      { movieId: movie.id, claims: [{ field: 'runtime', value: 999 }] },
      { movieId: 42 },
    ] });
    expect(result.status).toBe('partial');
    expect(result.movies.map(item => item.id)).toEqual([42]);
    expect(result.issues).toEqual([{ code: 'contradictory_claim', movieId: movie.id, field: 'runtime' }]);
  });

  it('does not invent movies that are absent from Search Agent results', () => {
    const result = runQualityAgent(evidence(), { movies: [{ movieId: 999 }] });
    expect(result).toMatchObject({ status: 'rejected', movies: [], issues: [{ code: 'unsupported_movie', movieId: 999 }] });
  });

  it.each([
    { field: 'title', value: 'Invented Title' },
    { field: 'overview', value: 'Invented plot' },
    { field: 'release_date', value: '2020-01-01' },
    { field: 'vote_average', value: 1 },
    { field: 'runtime', value: 99 },
    { field: 'genre', value: { id: 878, name: 'Invented genre' } },
    { field: 'director', value: { id: 99, name: 'Invented director' } },
    { field: 'cast_member', value: { id: 7, name: 'Invented actor', character: 'Cobb' } },
  ])('rejects contradictory $field claims', claim => {
    const result = runQualityAgent(evidence(), { movies: [{ movieId: movie.id, claims: [claim] }] });
    expect(result.status).toBe('rejected');
    expect(result.movies).toEqual([]);
    expect(result.issues[0]).toEqual({ code: 'contradictory_claim', movieId: movie.id, field: claim.field });
    expect(JSON.stringify(result)).not.toContain('Invented');
  });

  it.each([
    { field: 'runtime', value: 148 },
    { field: 'director', value: { id: 9, name: 'Director' } },
    { field: 'genre', value: { id: 878, name: 'Ficção científica' } },
    { field: 'cast_member', value: { id: 7, name: 'Actor', character: 'Cobb' } },
  ])('does not use another movie\'s $field facts as evidence', claim => {
    const result = runQualityAgent(evidence(), { movies: [{ movieId: 42, claims: [claim] }] });
    expect(result.status).toBe('rejected');
    expect(result.issues[0]).toMatchObject({ code: 'unsupported_claim', movieId: 42, field: claim.field });
  });

  it('does not treat a cast list limited to ten people as evidence about absent actors', () => {
    const result = runQualityAgent(evidence(), { movies: [{ movieId: movie.id, claims: [
      { field: 'cast_member', value: { id: 99, name: 'Unlisted Actor', character: 'Lead' } },
    ] }] });
    expect(result.issues[0].code).toBe('unsupported_claim');
  });

  it('treats missing character data as unknown rather than validating a fabricated role', () => {
    const result = runQualityAgent(evidence({ credits: [{ ...credits, cast: [{ ...credits.cast[0], character: '' }] }] }), {
      movies: [{ movieId: movie.id, claims: [{ field: 'cast_member', value: { id: 7, name: 'Actor', character: 'Cobb' } }] }],
    });
    expect(result.issues[0].code).toBe('unsupported_claim');
  });

  it('preserves zero values and represents unknown metadata with null/empty collections', () => {
    const zero = { ...movie, vote_average: 0 };
    const result = runQualityAgent(evidence({ movies: [zero], details: [{ ...zero, runtime: 0 }], credits: [] }), {
      movies: [{ movieId: movie.id, claims: [{ field: 'runtime', value: 0 }, { field: 'vote_average', value: 0 }] }],
    });
    expect(result.status).toBe('approved');
    expect(result.movies[0]).toMatchObject({ runtime: 0, vote_average: 0, genres: [], cast: [], director: null });

    const unknown = runQualityAgent(evidence({ movies: [{ ...movie, release_date: '', vote_average: undefined }], details: [], credits: [] }), selectMovie);
    expect(unknown.movies[0]).toMatchObject({ release_date: null, vote_average: null, runtime: null });
  });

  it('fills missing summary fields only from matching details', () => {
    const result = runQualityAgent(evidence({ movies: [{ ...movie, overview: '', poster_path: null, release_date: '', vote_average: undefined }] }), selectMovie);
    expect(result.status).toBe('approved');
    expect(result.movies[0]).toMatchObject(movie);
  });

  it.each([
    ['title', 'Conflicting title'],
    ['overview', 'Conflicting plot'],
    ['poster_path', '/other.jpg'],
    ['release_date', '2020-01-01'],
    ['vote_average', 1],
  ])('rejects conflicting %s between summaries and details', (field, value) => {
    const result = runQualityAgent(evidence({ details: [{ ...detail, [field]: value }] }), selectMovie);
    expect(result.status).toBe('rejected');
    expect(result.issues[0]).toEqual({ code: 'conflicting_evidence', movieId: movie.id });
  });

  it('does not attribute orphaned credits to a different movie', () => {
    const context = evidence({ credits: [{ ...credits, id: 99 }] });
    const grounded = runQualityAgent(context, selectMovie);
    expect(grounded.movies[0]).toMatchObject({ cast: [], director: null });
    const orphan = runQualityAgent(context, { movies: [{ movieId: 99 }] });
    expect(orphan.issues[0].code).toBe('unsupported_movie');
  });

  it('rejects invalid detail identity data even when the summary is otherwise valid', () => {
    const result = runQualityAgent(evidence({ details: [{ ...detail, title: '<script>private</script>' }] }), selectMovie);
    expect(result).toMatchObject({ status: 'rejected', movies: [], issues: [{ code: 'invalid_evidence', movieId: movie.id }] });
  });

  it('rejects a claimed director whose source job is not Director', () => {
    const result = runQualityAgent(evidence({ credits: [{ ...credits, director: { ...credits.director, job: 'Writer' } }] }), selectMovie);
    expect(result.issues[0].code).toBe('conflicting_evidence');
  });

  it('keeps grounded movies on partial Search Agent failure without exposing outcomes', () => {
    const context = evidence();
    context.status = 'partial';
    context.outcomes.push({ callIndex: 3, tool: 'get_trending', status: 'failed', reason: 'request_failed' });
    const result = runQualityAgent(context, selectMovie);
    expect(result.status).toBe('partial');
    expect(result.movies).toHaveLength(1);
    expect(result.issues).toEqual([{ code: 'partial_search' }]);
    expect(JSON.stringify(result)).not.toContain('request_failed');
    expect(result).not.toHaveProperty('outcomes');
  });

  it('distinguishes an empty successful search from an unavailable search', () => {
    const empty = { movies: [], details: [], credits: [] };
    const result = runQualityAgent(evidence({ ...empty, outcomes: [{ callIndex: 0, tool: 'search_movies', status: 'succeeded', itemCount: 0 }] }), { movies: [] });
    expect(result).toMatchObject({ status: 'empty', movies: [], issues: [] });
    const failed = runQualityAgent(evidence({ ...empty, status: 'failed', outcomes: [{ callIndex: 0, tool: 'search_movies', status: 'failed', reason: 'mcp_unavailable' }] }), selectMovie);
    expect(failed).toMatchObject({ status: 'unavailable', movies: [], issues: [{ code: 'search_unavailable' }] });
  });

  it('does not report a partial search as an authoritative empty result', () => {
    const context = evidence();
    context.status = 'partial';
    context.outcomes.push({ callIndex: 3, tool: 'get_trending', status: 'failed', reason: 'tool_error' });
    expect(runQualityAgent(context, { movies: [] })).toMatchObject({ status: 'partial', movies: [], issues: [{ code: 'partial_search' }] });
  });

  it.each([
    'raw private Markdown <script>untrusted</script>',
    { movies: [{ movieId: movie.id }], privatePrompt: 'private-model-output' },
    { movies: [{ movieId: movie.id, explanation: 'private-model-output' }] },
    { movies: [{ movieId: movie.id, claims: [{ field: 'awards', value: 'private-model-output' }] }] },
    { movies: [{ movieId: movie.id, claims: [{ field: 'title', value: movie.title, secret: 'private-model-output' }] }] },
    { movies: [{ movieId: movie.id, claims: [{ field: 'title', value: '<b>private-model-output</b>' }] }] },
    { movies: [{ movieId: '27205' }] },
    { movies: Array.from({ length: 21 }, () => ({ movieId: movie.id })) },
    { movies: [{ movieId: movie.id, claims: Array.from({ length: 21 }, () => ({ field: 'title', value: movie.title })) }] },
  ])('rejects malformed, unknown-field, free-text, or oversized proposals safely: %#', proposal => {
    const result = runQualityAgent(evidence(), proposal);
    expect(result).toMatchObject({ status: 'rejected', movies: [], issues: [{ code: 'invalid_proposal' }] });
    expect(JSON.stringify(result)).not.toContain('private-model-output');
  });

  it('strips unknown source fields rather than exposing transport/configuration data', () => {
    const context = { ...evidence(), privatePrompt: 'private-source-output', movies: [{ ...movie, secret: 'private-source-output' }] };
    const result = runQualityAgent(context, selectMovie);
    expect(result.status).toBe('approved');
    expect(JSON.stringify(result)).not.toContain('private-source-output');
  });

  it('sanitizes source text and invalid image paths, and returns only plain data', () => {
    const dirty = { ...movie, title: ' <b>A Origem</b>\u202e ', overview: 'Hello <script>private-script</script><b>world</b>\n', poster_path: 'javascript:private-script' };
    const result = runQualityAgent(evidence({ movies: [dirty], details: [], credits: [{ ...credits, cast: [{ ...credits.cast[0], profile_path: '//untrusted.example/x.png' }] }] }), {
      movies: [{ movieId: movie.id, claims: [{ field: 'title', value: 'A Origem' }] }],
    });
    expect(result.status).toBe('approved');
    expect(result.movies[0]).toMatchObject({ title: 'A Origem', overview: 'Hello world', poster_path: null });
    expect(result.movies[0].cast[0].profile_path).toBeNull();
    expect(JSON.stringify(result)).not.toContain('private-script');
    expect(qualityAgentResultSchema.safeParse(result).success).toBe(true);
  });

  it.each(['https://evil.example/poster.jpg', '/../poster.jpg', '/poster.jpg?secret=x', '//evil.jpg'])('does not forward unsafe poster paths: %s', poster_path => {
    const result = runQualityAgent(evidence({ movies: [{ ...movie, poster_path }], details: [] }), selectMovie);
    expect(result.movies[0].poster_path).toBeNull();
  });

  it.each(['MCP_INTERNAL_API_KEY=test-secret', 'Authorization: Bearer test-secret', 'api_key=test-secret', 'AIza' + 'x'.repeat(32)])('rejects credential-like source content without echoing it: %#', overview => {
    const result = runQualityAgent(evidence({ movies: [{ ...movie, overview }], details: [] }), selectMovie);
    expect(result.status).toBe('rejected');
    expect(JSON.stringify(result)).not.toContain(overview);
  });

  it.each([
    { title: '<script>private-title</script>' },
    { title: 'x'.repeat(501) },
    { overview: 'x'.repeat(10001) },
    { overview: '<script>' + 'x'.repeat(10001) + '</script>' },
    { vote_average: 11 },
    { release_date: '2020-02-31' },
  ])('rejects invalid canonical movie data: %#', fields => {
    const result = runQualityAgent(evidence({ movies: [{ ...movie, ...fields }], details: [] }), selectMovie);
    expect(result.status).toBe('rejected');
    expect(result.issues[0].code).toBe('invalid_evidence');
  });

  it.each([
    { status: 'partial' },
    { outcomes: [] },
    { movies: Array.from({ length: 101 }, () => movie) },
    { movies: [movie, movie] },
    { details: [detail, detail] },
    { credits: [credits, credits] },
    { outcomes: [{ callIndex: 3, tool: 'search_movies', status: 'succeeded', itemCount: 2 }] },
    { outcomes: [{ callIndex: 0, tool: 'search_movies', status: 'succeeded', itemCount: 0 }] },
    { outcomes: [{ callIndex: 0, tool: 'search_movies', status: 'succeeded', itemCount: 21 }] },
    { outcomes: [
      { callIndex: 0, tool: 'search_movies', status: 'succeeded', itemCount: 2 },
      { callIndex: 0, tool: 'get_movie_details', status: 'succeeded', itemCount: 1 },
    ] },
    { status: 'failed', outcomes: [{ callIndex: 0, tool: 'search_movies', status: 'failed', reason: 'mcp_unavailable' }] },
    { details: [{ ...detail, id: 999 }] },
  ])('fails closed on malformed or inconsistent evidence: %#', fields => {
    const result = runQualityAgent({ ...evidence(), ...fields }, selectMovie);
    expect(result).toMatchObject({ status: 'rejected', movies: [], issues: [{ code: 'invalid_evidence' }] });
  });

  it.each([
    { details: [{ ...detail, genres: [detail.genres[0], detail.genres[0]] }] },
    { credits: [{ ...credits, cast: [credits.cast[0], credits.cast[0]] }] },
  ])('rejects conflicting duplicate person/genre evidence: %#', fields => {
    const result = runQualityAgent(evidence(fields), selectMovie);
    expect(result.status).toBe('rejected');
    expect(result.issues[0]).toEqual({ code: 'conflicting_evidence', movieId: movie.id });
  });

  it.each([
    { details: [{ ...detail, genres: Array.from({ length: 31 }, (_, id) => ({ id: id + 1, name: 'Genre' })) }] },
    { credits: [{ ...credits, cast: Array.from({ length: 11 }, (_, id) => ({ ...credits.cast[0], id: id + 1 })) }] },
    { credits: [{ ...credits, director: { ...credits.director, name: 'x'.repeat(501) } }] },
  ])('bounds nested source metadata before text sanitization: %#', fields => {
    const result = runQualityAgent(evidence(fields), selectMovie);
    expect(result).toMatchObject({ status: 'rejected', movies: [], issues: [{ code: 'invalid_evidence' }] });
  });

  it('bounds public issues even when every selected movie is unsupported and search is partial', () => {
    const context = evidence();
    context.status = 'partial';
    context.outcomes.push({ callIndex: 3, tool: 'get_trending', status: 'failed', reason: 'tool_error' });
    const result = runQualityAgent(context, { movies: Array.from({ length: 20 }, (_, index) => ({ movieId: 1000 + index })) });
    expect(result.status).toBe('rejected');
    expect(result.issues).toHaveLength(21);
    expect(qualityAgentResultSchema.safeParse(result).success).toBe(true);
  });

  it('validates the final DTO strictly, including nested keys and plain-text constraints', () => {
    const approved = runQualityAgent(evidence(), selectMovie);
    expect(qualityAgentResultSchema.safeParse({ ...approved, rawModelOutput: 'private' }).success).toBe(false);
    expect(qualityAgentResultSchema.safeParse({ ...approved, movies: [{ ...approved.movies[0], privatePrompt: 'private' }] }).success).toBe(false);
    expect(qualityAgentResultSchema.safeParse({ ...approved, movies: [{ ...approved.movies[0], title: '<script>private</script>' }] }).success).toBe(false);
  });
});
