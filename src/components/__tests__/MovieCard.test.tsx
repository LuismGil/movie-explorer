import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, useLocation } from 'react-router-dom';
import { describe, expect, it, beforeEach } from 'vitest';
import { MovieCard } from '../MovieCard';
import { WatchlistProvider, useWatchlist } from '../../context/WatchlistContext';
import type { MovieListItem } from '../../types/movie';

const sampleMovie: MovieListItem = {
  id: 7,
  title: 'Movie Card Test',
  poster_path: null,
  vote_average: 8.1,
  release_date: '2021-05-12',
};

function LocationDisplay() {
  const location = useLocation();
  return <span data-testid="path">{location.pathname}</span>;
}

function MovieCardHarness() {
  const { watchlist } = useWatchlist();
  return (
    <div>
      <MovieCard movie={sampleMovie} />
      <span data-testid="count">{watchlist.length}</span>
      <LocationDisplay />
    </div>
  );
}

describe('MovieCard', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('toggles watchlist without navigating', async () => {
    const user = userEvent.setup();

    render(
      <MemoryRouter initialEntries={['/']}>
        <WatchlistProvider>
          <MovieCardHarness />
        </WatchlistProvider>
      </MemoryRouter>,
    );

    expect(screen.getByTestId('count')).toHaveTextContent('0');
    expect(screen.getByTestId('path')).toHaveTextContent('/');

    await user.click(screen.getByRole('button', { name: 'Adicionar à watchlist' }));

    expect(screen.getByTestId('count')).toHaveTextContent('1');
    expect(screen.getByTestId('path')).toHaveTextContent('/');
  });
});
