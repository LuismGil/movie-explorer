import { act, cleanup, render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { StrictMode, type ReactNode } from 'react';
import { hydrateRoot, type Root } from 'react-dom/client';
import { renderToString } from 'react-dom/server';
import { describe, expect, it, beforeEach, afterEach, vi } from 'vitest';
import { useWatchlist } from '@/context/WatchlistContext';
import { WatchlistProvider } from '@/context/WatchlistProvider';
import type { MovieListItem } from '@/types/movie';

const sampleMovie: MovieListItem = {
  id: 42,
  title: 'Sample Movie',
  poster_path: null,
  vote_average: 7.5,
  release_date: '2020-01-01',
};

const storageKey = 'movie-explorer:watchlist';

function WatchlistTestHarness() {
  const { watchlist, isInWatchlist, toggleWatchlist } = useWatchlist();
  return (
    <div>
      <button
        type="button"
        aria-pressed={isInWatchlist(sampleMovie.id)}
        onClick={() => toggleWatchlist(sampleMovie)}
      >
        toggle
      </button>
      <span data-testid="count">{watchlist.length}</span>
    </div>
  );
}

function renderOnServer(ui: ReactNode) {
  // Model the server environment without sharing JSDOM's browser storage.
  vi.stubGlobal('window', undefined);
  try {
    return renderToString(ui);
  } finally {
    vi.unstubAllGlobals();
  }
}

describe('WatchlistContext', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  afterEach(() => {
    cleanup();
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
  });

  it('adds and removes items', async () => {
    const user = userEvent.setup();

    render(
      <WatchlistProvider>
        <WatchlistTestHarness />
      </WatchlistProvider>,
    );

    expect(screen.getByTestId('count')).toHaveTextContent('0');

    await user.click(screen.getByRole('button', { name: 'toggle' }));
    expect(screen.getByTestId('count')).toHaveTextContent('1');

    await waitFor(() => {
      const stored = localStorage.getItem(storageKey);
      expect(stored).toContain('Sample Movie');
    });

    await user.click(screen.getByRole('button', { name: 'toggle' }));
    expect(screen.getByTestId('count')).toHaveTextContent('0');
    expect(localStorage.getItem(storageKey)).toBe('[]');
  });

  it('restores saved movies on a client-only mount', async () => {
    localStorage.setItem(storageKey, JSON.stringify([sampleMovie]));

    render(
      <WatchlistProvider>
        <WatchlistTestHarness />
      </WatchlistProvider>,
    );

    expect(screen.getByTestId('count')).toHaveTextContent('1');
    expect(screen.getByRole('button', { name: 'toggle' })).toHaveAttribute('aria-pressed', 'true');

    await userEvent.setup().click(screen.getByRole('button', { name: 'toggle' }));
    expect(screen.getByTestId('count')).toHaveTextContent('0');
    expect(localStorage.getItem(storageKey)).toBe('[]');
  });

  it('server-renders an empty watchlist without accessing browser storage', () => {
    localStorage.setItem(storageKey, JSON.stringify([sampleMovie]));
    const read = vi.spyOn(Storage.prototype, 'getItem');
    const write = vi.spyOn(Storage.prototype, 'setItem');

    const html = renderOnServer(
      <WatchlistProvider>
        <WatchlistTestHarness />
      </WatchlistProvider>,
    );

    expect(html).toContain('data-testid="count">0</span>');
    expect(html).toContain('aria-pressed="false"');
    expect(read).not.toHaveBeenCalled();
    expect(write).not.toHaveBeenCalled();
  });

  it.each([
    { name: 'empty', movies: [] },
    { name: 'persisted', movies: [sampleMovie] },
  ])('hydrates a $name watchlist without mismatches or losing saved movies', async ({ movies }) => {
    const serialized = JSON.stringify(movies);
    localStorage.setItem(storageKey, serialized);
    const writes = vi.spyOn(Storage.prototype, 'setItem');
    const onRecoverableError = vi.fn();
    const ui = (
      <StrictMode>
        <WatchlistProvider>
          <WatchlistTestHarness />
        </WatchlistProvider>
      </StrictMode>
    );
    const container = document.createElement('div');
    container.innerHTML = renderOnServer(ui);
    document.body.appendChild(container);
    let root: Root | undefined;

    try {
      expect(within(container).getByTestId('count')).toHaveTextContent('0');

      await act(async () => {
        root = hydrateRoot(container, ui, { onRecoverableError });
      });

      expect(onRecoverableError).not.toHaveBeenCalled();
      expect(within(container).getByTestId('count')).toHaveTextContent(String(movies.length));
      expect(within(container).getByRole('button', { name: 'toggle' }))
        .toHaveAttribute('aria-pressed', String(movies.length > 0));
      expect(localStorage.getItem(storageKey)).toBe(serialized);

      if (movies.length > 0) {
        expect(writes).not.toHaveBeenCalledWith(storageKey, '[]');
        await userEvent.setup().click(within(container).getByRole('button', { name: 'toggle' }));
        expect(within(container).getByTestId('count')).toHaveTextContent('0');
        expect(localStorage.getItem(storageKey)).toBe('[]');
      }
    } finally {
      await act(async () => root?.unmount());
      container.remove();
    }
  });

  it.each(['invalid-json', 'null', '{}'])('falls back to an empty watchlist for invalid storage: %s', (stored) => {
    localStorage.setItem(storageKey, stored);
    vi.spyOn(console, 'warn').mockImplementation(() => {});

    render(
      <WatchlistProvider>
        <WatchlistTestHarness />
      </WatchlistProvider>,
    );

    expect(screen.getByTestId('count')).toHaveTextContent('0');
    expect(localStorage.getItem(storageKey)).toBe('[]');
  });
});
