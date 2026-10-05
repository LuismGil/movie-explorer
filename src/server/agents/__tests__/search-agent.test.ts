import { beforeEach, describe, expect, it, vi } from 'vitest';

const { mockGetMcpClient } = vi.hoisted(() => ({ mockGetMcpClient: vi.fn() }));

vi.mock('../../mcp/client', () => ({ getMcpClient: mockGetMcpClient }));

import { runSearchAgent } from '../search-agent';

function textResult(payload: unknown) {
  return { content: [{ type: 'text' as const, text: JSON.stringify(payload) }] };
}

const movie = {
  id: 42,
  title: 'Example Film',
  overview: '',
  poster_path: null,
  release_date: '',
};

describe('runSearchAgent', () => {
  const callTool = vi.fn();

  beforeEach(() => {
    vi.resetAllMocks();
    mockGetMcpClient.mockResolvedValue({ callTool });
  });

  it('executes planned tools, merges duplicate movies, and preserves TMDB IDs', async () => {
    callTool.mockImplementation(async ({ name }: { name: string }) => {
      if (name === 'search_movies') {
        return textResult({
          results: [movie, { ...movie, id: 43, title: 'Another Film' }],
          total_pages: 2,
        });
      }
      return textResult({
        results: [{
          ...movie,
          overview: 'Overview from trending',
          poster_path: '/poster.jpg',
          release_date: '2026-01-02',
          vote_average: 8.4,
        }],
      });
    });

    const result = await runSearchAgent({
      calls: [
        { tool: 'search_movies', query: ' example ', page: 2 },
        { tool: 'get_trending', window: 'week' },
      ],
    });

    expect(result.status).toBe('complete');
    expect(result.movies).toHaveLength(2);
    expect(result.movies[0]).toMatchObject({
      id: 42,
      title: 'Example Film',
      overview: 'Overview from trending',
      poster_path: '/poster.jpg',
      release_date: '2026-01-02',
      vote_average: 8.4,
    });
    expect(result.movies[1].id).toBe(43);
    expect(result.outcomes).toEqual([
      { callIndex: 0, tool: 'search_movies', status: 'succeeded', itemCount: 2 },
      { callIndex: 1, tool: 'get_trending', status: 'succeeded', itemCount: 1 },
    ]);
    expect(callTool).toHaveBeenCalledWith(
      { name: 'search_movies', arguments: { query: 'example', page: 2 } },
      expect.anything(),
    );
  });

  it('keeps valid results when another MCP tool reports an error', async () => {
    callTool.mockImplementation(async ({ name }: { name: string }) => {
      if (name === 'search_movies') return textResult({ results: [movie], total_pages: 1 });
      return { isError: true, content: [{ type: 'text' as const, text: 'private upstream detail' }] };
    });

    const result = await runSearchAgent({
      calls: [
        { tool: 'search_movies', query: 'example' },
        { tool: 'get_trending' },
      ],
    });

    expect(result.status).toBe('partial');
    expect(result.movies).toHaveLength(1);
    expect(result.outcomes[1]).toEqual({
      callIndex: 1,
      tool: 'get_trending',
      status: 'failed',
      reason: 'tool_error',
    });
    expect(JSON.stringify(result)).not.toContain('private upstream detail');
  });

  it('validates tool outputs and reports invalid data without discarding other calls', async () => {
    callTool.mockImplementation(async ({ name }: { name: string }) => {
      if (name === 'search_movies') return textResult({ results: [{ id: 'bad-id' }] });
      return textResult({ results: [movie] });
    });

    const result = await runSearchAgent({
      calls: [
        { tool: 'search_movies', query: 'example' },
        { tool: 'get_recommendations', movieId: '42' },
      ],
    });

    expect(result.status).toBe('partial');
    expect(result.movies.map(({ id }) => id)).toEqual([42]);
    expect(result.outcomes[0]).toMatchObject({ status: 'failed', reason: 'invalid_output' });
  });

  it('preserves movie details and movie-scoped credits', async () => {
    callTool.mockImplementation(async ({ name }: { name: string }) => {
      if (name === 'get_movie_details') {
        return textResult({
          ...movie,
          id: 42,
          title: 'Example Film',
          overview: 'Full overview',
          genres: [{ id: 7, name: 'Drama' }],
          runtime: 120,
        });
      }
      return textResult({ id: 42, cast: [], director: null });
    });

    const result = await runSearchAgent({
      calls: [
        { tool: 'get_movie_details', movieId: '42' },
        { tool: 'get_credits', movieId: '42' },
      ],
    });

    expect(result.status).toBe('complete');
    expect(result.movies[0]).toMatchObject({ id: 42, title: 'Example Film' });
    expect(result.details[0]).toMatchObject({ id: 42, runtime: 120, genres: [{ id: 7, name: 'Drama' }] });
    expect(result.credits).toEqual([{ id: 42, cast: [], director: null }]);
  });

  it('rejects detail data whose TMDB ID does not match the requested movie', async () => {
    callTool.mockResolvedValue(textResult({ ...movie, id: 84 }));

    const result = await runSearchAgent({
      calls: [{ tool: 'get_movie_details', movieId: '42' }],
    });

    expect(result.status).toBe('failed');
    expect(result.movies).toEqual([]);
    expect(result.outcomes[0]).toMatchObject({ status: 'failed', reason: 'invalid_output' });
  });

  it('merges duplicate credits for the same TMDB movie without duplicate cast members', async () => {
    callTool.mockImplementationOnce(async () => textResult({
      id: 42,
      cast: [{ id: 7, name: 'Actor', character: '', profile_path: null }],
      director: null,
    })).mockImplementationOnce(async () => textResult({
      id: 42,
      cast: [
        { id: 7, name: 'Actor', character: 'Lead', profile_path: '/actor.jpg' },
        { id: 8, name: 'Another Actor', character: 'Friend', profile_path: null },
      ],
      director: { id: 9, name: 'Director', job: 'Director', department: 'Directing' },
    }));

    const result = await runSearchAgent({
      calls: [
        { tool: 'get_credits', movieId: '42' },
        { tool: 'get_credits', movieId: '42' },
      ],
    });

    expect(result.credits).toEqual([{
      id: 42,
      cast: [
        { id: 7, name: 'Actor', character: 'Lead', profile_path: '/actor.jpg' },
        { id: 8, name: 'Another Actor', character: 'Friend', profile_path: null },
      ],
      director: { id: 9, name: 'Director', job: 'Director', department: 'Directing' },
    }]);
  });

  it('returns a sanitized failed outcome when the MCP client is unavailable', async () => {
    mockGetMcpClient.mockRejectedValue(new Error('credential leaked in transport error'));

    const result = await runSearchAgent({
      calls: [{ tool: 'search_movies', query: 'example' }],
    });

    expect(result).toEqual({
      status: 'failed',
      movies: [],
      details: [],
      credits: [],
      outcomes: [{
        callIndex: 0,
        tool: 'search_movies',
        status: 'failed',
        reason: 'mcp_unavailable',
      }],
    });
    expect(JSON.stringify(result)).not.toContain('credential leaked');
  });

  it('rejects invalid plans before opening the MCP client', async () => {
    await expect(runSearchAgent({ calls: [{ tool: 'search_movies', query: '   ' }] })).rejects.toThrow();
    expect(mockGetMcpClient).not.toHaveBeenCalled();
  });
});
