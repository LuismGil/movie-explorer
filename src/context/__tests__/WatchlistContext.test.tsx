import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, beforeEach } from 'vitest';
import { WatchlistProvider, useWatchlist } from '../WatchlistContext';
import type { MovieListItem } from '../../types/movie';

const sampleMovie: MovieListItem = {
  id: 42,
  title: 'Sample Movie',
  poster_path: null,
  vote_average: 7.5,
  release_date: '2020-01-01',
};

function WatchlistTestHarness() {
  const { watchlist, toggleWatchlist } = useWatchlist();
  return (
    <div>
      <button type="button" onClick={() => toggleWatchlist(sampleMovie)}>
        toggle
      </button>
      <span data-testid="count">{watchlist.length}</span>
    </div>
  );
}

describe('WatchlistContext', () => {
  beforeEach(() => {
    localStorage.clear();
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
      const stored = localStorage.getItem('movie-explorer:watchlist');
      expect(stored).toContain('Sample Movie');
    });

    await user.click(screen.getByRole('button', { name: 'toggle' }));
    expect(screen.getByTestId('count')).toHaveTextContent('0');
  });
});
