import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, beforeEach } from 'vitest';
import { MovieCard } from '../MovieCard';
import { useWatchlist } from '../../context/WatchlistContext';
import { WatchlistProvider } from '../../context/WatchlistProvider';
import type { MovieListItem } from '../../types/movie';

const sampleMovie: MovieListItem = {
  id: 7,
  title: 'Movie Card Test',
  poster_path: null,
  vote_average: 8.1,
  release_date: '2021-05-12',
};

function MovieCardHarness() {
  const { watchlist } = useWatchlist();
  return (
    <div>
      <MovieCard movie={sampleMovie} />
      <span data-testid="count">{watchlist.length}</span>
    </div>
  );
}

describe('MovieCard', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('toggles watchlist successfully', async () => {
    const user = userEvent.setup();

    render(
      <WatchlistProvider>
        <MovieCardHarness />
      </WatchlistProvider>,
    );

    expect(screen.getByTestId('count')).toHaveTextContent('0');

    await user.click(screen.getByRole('button', { name: 'Add to watchlist' }));

    expect(screen.getByTestId('count')).toHaveTextContent('1');
  });
});
