import { afterEach, describe, expect, it, vi } from 'vitest';
import {
  catalogOpenTool,
  catalogResultsTool,
  createCatalogState,
  getCatalogResults,
  getWatchlist,
  openCatalogMovie,
  registerShellCatalogTools,
  searchCatalog,
  type ToolResult,
} from '../../../../public/webmcp-catalog.js';

const movies = Array.from({ length: 7 }, (_, index) => ({
  id: index + 1,
  title: `Movie ${index + 1}`,
  release_date: '2020-01-01',
  vote_average: 7.5,
}));

function output(result: ToolResult) {
  return JSON.parse(result.content[0].text);
}

describe('WebMCP catalog contracts', () => {
  afterEach(() => vi.restoreAllMocks());

  it('returns bounded pages of only the visible movie fields', () => {
    const state = createCatalogState({ results: movies, page: 2, totalPages: 3, status: 'ok' });
    expect(output(getCatalogResults(state, {}))).toEqual({
      page: 2,
      total_pages: 3,
      items: movies.slice(0, 5),
      count: 7,
      next_offset: 5,
    });
    expect(output(getCatalogResults(state, { offset: 5, limit: 5 }))).toMatchObject({
      items: movies.slice(5),
      next_offset: null,
    });
    expect(catalogResultsTool.annotations).toMatchObject({ readOnlyHint: true, untrustedContentHint: true });
  });

  it.each([
    null, [], { offset: -1 }, { offset: 1.5 }, { limit: 6 }, { limit: 0 }, { extra: 'ignored?' },
  ])('rejects invalid pagination without returning data: %j', input => {
    const result = getCatalogResults(createCatalogState({ results: movies, page: 1, totalPages: 1, status: 'ok' }), input);
    expect(result.isError).toBe(true);
    expect(output(result).error.code).toBe('INVALID_ARGUMENTS');
  });

  it('distinguishes an empty catalog from an unavailable catalog', () => {
    const empty = createCatalogState({ results: [], page: 1, totalPages: 1, status: 'ok' });
    const failed = createCatalogState({ results: movies, page: 1, totalPages: 1, status: 'error' });
    expect(output(getCatalogResults(empty, {})).items).toEqual([]);
    expect(output(getCatalogResults(failed, {})).error.code).toBe('CATALOG_UNAVAILABLE');
    expect(getCatalogResults(failed, {}).isError).toBe(true);
  });

  it('allows navigation only to a positive ID in the currently displayed catalog', () => {
    const state = createCatalogState({ results: movies, page: 1, totalPages: 1, status: 'ok' });
    const navigate = vi.fn();
    expect(output(openCatalogMovie(state, { movieId: 2 }, navigate))).toEqual({
      status: 'navigation_started',
      movie_id: 2,
    });
    expect(navigate).toHaveBeenCalledOnce();
    expect(navigate).toHaveBeenCalledWith('/movie/2');
    for (const input of [{ movieId: 8 }, { movieId: '../discover' }, { movieId: 0 }, { movieId: 1, url: '/discover' }]) {
      expect(openCatalogMovie(state, input, navigate).isError).toBe(true);
    }
    expect(navigate).toHaveBeenCalledOnce();
    expect(catalogOpenTool.annotations.readOnlyHint).toBe(false);
  });

  it('encodes searches and supports the same empty-query reset as the form', () => {
    const navigate = vi.fn();
    searchCatalog({ query: '  Alien & Aliens  ' }, navigate);
    expect(navigate).toHaveBeenLastCalledWith('/?query=Alien+%26+Aliens');
    searchCatalog({ query: '' }, navigate);
    expect(navigate).toHaveBeenLastCalledWith('/');
    expect(searchCatalog({ query: 'x'.repeat(201) }, navigate).isError).toBe(true);
    expect(searchCatalog({ query: 42 }, navigate).isError).toBe(true);
    expect(navigate).toHaveBeenCalledTimes(2);
  });

  it('returns a safe error when navigation fails', () => {
    const state = createCatalogState({ results: movies, page: 1, totalPages: 1, status: 'ok' });
    const navigate = () => { throw new Error('private browser detail'); };
    expect(output(searchCatalog({ query: 'movie' }, navigate)).error.code).toBe('NAVIGATION_FAILED');
    const result = openCatalogMovie(state, { movieId: 1 }, navigate);
    expect(result.isError).toBe(true);
    expect(JSON.stringify(result)).not.toContain('private browser detail');
  });

  it('reads only bounded, valid watchlist summaries and never exposes extra storage fields', () => {
    const result = getWatchlist([
      { ...movies[0], poster_path: '/poster.jpg', private_field: 'do not expose' },
      null,
      { id: -1, title: 'Invalid' },
      { ...movies[1], title: 'x'.repeat(300), vote_average: 200 },
    ], {});
    const data = output(result);
    expect(data.count).toBe(2);
    expect(data.items[0]).toEqual(movies[0]);
    expect(data.items[1].title).toHaveLength(120);
    expect(data.items[1].vote_average).toBeNull();
    expect(JSON.stringify(data)).not.toContain('private_field');
    expect(JSON.stringify(data)).not.toContain('poster_path');
  });

  it('registers only the two imperative shell tools and cleans them up through one signal', async () => {
    const registerTool = vi.fn(async (tool: object, options: { signal: AbortSignal }) => {
      if (!tool || options.signal.aborted) throw new Error('invalid registration');
    });
    const state = createCatalogState({ results: movies, page: 1, totalPages: 1, status: 'ok' });
    const controller = registerShellCatalogTools({ registerTool }, state, vi.fn());
    await vi.waitFor(() => expect(registerTool).toHaveBeenCalledTimes(2));
    expect(registerTool.mock.calls.map(([tool]) => (tool as { name: string }).name).sort())
      .toEqual(['get_catalog_results', 'open_movie_details']);
    expect(registerTool.mock.calls.every(([, options]) => options.signal === controller.signal)).toBe(true);
    controller.abort();
    expect(registerTool.mock.calls.every(([, options]) => options.signal.aborted)).toBe(true);
  });

  it('aborts all shell registrations if any registration fails', async () => {
    vi.spyOn(console, 'warn').mockImplementation(() => {});
    const registerTool = vi.fn(async (tool: object) => {
      if ((tool as { name: string }).name === 'open_movie_details') throw new Error('internal detail');
    });
    const state = createCatalogState({ results: movies, page: 1, totalPages: 1, status: 'ok' });
    const controller = registerShellCatalogTools({ registerTool }, state, vi.fn());
    await vi.waitFor(() => expect(controller.signal.aborted).toBe(true));
    expect(console.warn).toHaveBeenCalledWith('WebMCP catalog tools could not be registered.');
  });

  it('does not navigate when a shell tool execution has already been cancelled', async () => {
    const tools: Array<{ name: string; execute: (input: unknown, options: { signal: AbortSignal }) => Promise<ToolResult> }> = [];
    const registerTool = vi.fn(async (tool: object) => { tools.push(tool as typeof tools[number]); });
    const navigate = vi.fn();
    const state = createCatalogState({ results: movies, page: 1, totalPages: 1, status: 'ok' });
    registerShellCatalogTools({ registerTool }, state, navigate);
    await vi.waitFor(() => expect(tools).toHaveLength(2));
    const controller = new AbortController();
    controller.abort();
    const result = await tools.find(tool => tool.name === 'open_movie_details')!.execute({ movieId: 1 }, { signal: controller.signal });
    expect(output(result).error.code).toBe('CANCELLED');
    expect(navigate).not.toHaveBeenCalled();
  });
});
