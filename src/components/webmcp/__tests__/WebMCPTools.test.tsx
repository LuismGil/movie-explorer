import { cleanup, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { StrictMode } from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { WatchlistContext, useWatchlist } from '@/context/WatchlistContext';
import { WatchlistProvider } from '@/context/WatchlistProvider';
import { CatalogTools } from '../CatalogTools';
import { MovieTools, type CurrentMovie } from '../MovieTools';
import { WatchlistTools } from '../WatchlistTools';
import { createCatalogState, type ToolResult } from '../../../../public/webmcp-catalog.js';

type RegisteredTool = {
  name: string;
  annotations?: { readOnlyHint?: boolean; untrustedContentHint?: boolean };
  execute: (input: unknown, options: { signal: AbortSignal }) => Promise<ToolResult>;
};

const movie = {
  id: 42,
  title: 'Sample Movie',
  poster_path: null,
  vote_average: 7.5,
  release_date: '2020-01-01',
};

const details: CurrentMovie = {
  id: 42,
  title: movie.title,
  director: null,
  genres: ['Drama'],
  vote_average: movie.vote_average,
  release_date: movie.release_date,
  runtime: 100,
  overview: 'A movie.',
};

function installRegistry() {
  const tools = new Map<string, RegisteredTool>();
  const registerTool = vi.fn(async (tool: RegisteredTool, options: { signal: AbortSignal }) => {
    if (options.signal.aborted) throw new Error('aborted');
    tools.set(tool.name, tool);
    options.signal.addEventListener('abort', () => {
      if (tools.get(tool.name) === tool) tools.delete(tool.name);
    }, { once: true });
  });
  Object.defineProperty(document, 'modelContext', { configurable: true, value: { registerTool } });
  return { tools, registerTool };
}

async function invoke(tool: RegisteredTool, input: unknown = {}) {
  const result = await tool.execute(input, { signal: new AbortController().signal });
  return { result, value: JSON.parse(result.content[0].text) };
}

function ToggleMovie() {
  const { toggleWatchlist } = useWatchlist();
  return <button type="button" onClick={() => toggleWatchlist(movie)}>toggle</button>;
}

beforeEach(() => localStorage.clear());
afterEach(() => {
  cleanup();
  Reflect.deleteProperty(document, 'modelContext');
  vi.restoreAllMocks();
});

describe('page-scoped WebMCP tools', () => {
  it('registers the React catalog tools, reads fresh state, and cleans up under Strict Mode', async () => {
    const { tools, registerTool } = installRegistry();
    const state = createCatalogState({ results: [movie], page: 1, totalPages: 1, status: 'ok' });
    const view = render(<StrictMode><CatalogTools state={state} /></StrictMode>);
    await waitFor(() => expect([...tools.keys()].sort()).toEqual([
      'get_catalog_results', 'open_movie_details', 'search_movies_catalog',
    ]));
    expect((await invoke(tools.get('get_catalog_results')!)).value.items[0].id).toBe(42);
    const registrations = registerTool.mock.calls.length;

    view.rerender(<StrictMode><CatalogTools state={{ ...state, results: [] }} /></StrictMode>);
    await waitFor(async () => expect((await invoke(tools.get('get_catalog_results')!)).value.items).toEqual([]));
    expect(registerTool).toHaveBeenCalledTimes(registrations);
    view.unmount();
    expect(tools.size).toBe(0);
  });

  it('registers only current-movie details and rejects unexpected inputs', async () => {
    const { tools } = installRegistry();
    const view = render(<MovieTools movie={details} />);
    await waitFor(() => expect([...tools.keys()]).toEqual(['get_current_movie_details']));
    const tool = tools.get('get_current_movie_details')!;
    expect(tool.annotations).toMatchObject({ readOnlyHint: true, untrustedContentHint: true });
    expect((await invoke(tool)).value).toEqual(details);
    expect((await invoke(tool, { movieId: 9 })).result.isError).toBe(true);
    view.unmount();
    expect(tools.size).toBe(0);
  });

  it('waits for hydration before exposing the watchlist tool', async () => {
    const { tools } = installRegistry();
    const context = {
      watchlist: [movie],
      isHydrated: false,
      isInWatchlist: () => true,
      toggleWatchlist: vi.fn(),
    };
    const view = render(<WatchlistContext.Provider value={context}><WatchlistTools /></WatchlistContext.Provider>);
    expect(tools.size).toBe(0);
    view.rerender(<WatchlistContext.Provider value={{ ...context, isHydrated: true }}><WatchlistTools /></WatchlistContext.Provider>);
    await waitFor(() => expect([...tools.keys()]).toEqual(['get_watchlist']));
    expect((await invoke(tools.get('get_watchlist')!)).value.items[0].id).toBe(42);
    view.unmount();
    expect(tools.size).toBe(0);
  });

  it('reads the current watchlist state but never registers it from the global provider alone', async () => {
    const { tools } = installRegistry();
    localStorage.setItem('movie-explorer:watchlist', JSON.stringify([movie]));
    const view = render(<WatchlistProvider><ToggleMovie /></WatchlistProvider>);
    expect(tools.size).toBe(0);
    view.rerender(<WatchlistProvider><WatchlistTools /><ToggleMovie /></WatchlistProvider>);
    await waitFor(() => expect([...tools.keys()]).toEqual(['get_watchlist']));
    expect((await invoke(tools.get('get_watchlist')!)).value.items).toHaveLength(1);
    await userEvent.setup().click(screen.getByRole('button', { name: 'toggle' }));
    await waitFor(async () => expect((await invoke(tools.get('get_watchlist')!)).value.items).toHaveLength(0));
    view.unmount();
    expect(tools.size).toBe(0);
  });

  it('renders without a WebMCP implementation', () => {
    const view = render(<MovieTools movie={details} />);
    expect(view.container).toBeEmptyDOMElement();
    view.unmount();
  });
});
