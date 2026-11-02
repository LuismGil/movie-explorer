import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, beforeEach } from 'vitest';
import { MovieCard } from '@/components/MovieCard';
import { useWatchlist } from '@/context/WatchlistContext';
import { WatchlistProvider } from '@/context/WatchlistProvider';
import type { MovieListItem } from '@/types/movie';
import { messages } from '@/i18n';

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

    await user.click(screen.getByRole('button', { name: messages.watchlist.addAriaLabel(sampleMovie.title) }));

    expect(screen.getByTestId('count')).toHaveTextContent('1');
    expect(screen.getByRole('button', { name: messages.watchlist.removeAriaLabel(sampleMovie.title) })).toHaveAttribute('aria-pressed', 'true');
  });

  it('keeps the poster link and named watchlist action separately keyboard accessible', async () => {
    const user = userEvent.setup();
    render(<WatchlistProvider><MovieCard movie={sampleMovie} /></WatchlistProvider>);
    const link = screen.getByRole('link');
    const button = screen.getByRole('button', { name: messages.watchlist.addAriaLabel(sampleMovie.title) });
    expect(link).not.toContainElement(button);
    await user.tab();
    expect(link).toHaveFocus();
    await user.tab();
    expect(button).toHaveFocus();
    await user.keyboard(' ');
    expect(button).toHaveAttribute('aria-pressed', 'true');
  });
});
