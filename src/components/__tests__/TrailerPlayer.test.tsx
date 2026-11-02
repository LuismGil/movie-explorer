import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';
import { TrailerPlayer } from '../TrailerPlayer';
import { messages } from '@/i18n';

afterEach(cleanup);

describe('intent-driven trailer', () => {
  it('loads no external player on mount and offers an ordinary video link', () => {
    const { container } = render(<TrailerPlayer videoKey="example-key" />);
    expect(container.querySelector('iframe')).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: messages.movie.loadTrailer })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: messages.movie.externalTrailer })).toHaveAttribute('rel', 'noopener noreferrer');
  });

  it('loads the privacy-enhanced player only after explicit activation', () => {
    render(<TrailerPlayer videoKey="example-key" />);
    fireEvent.click(screen.getByRole('button', { name: messages.movie.loadTrailer }));
    expect(screen.getByTitle(messages.movie.trailerTitle)).toHaveAttribute('src', 'https://www.youtube-nocookie.com/embed/example-key?autoplay=1&rel=0');
    expect(screen.queryByRole('button', { name: messages.movie.loadTrailer })).not.toBeInTheDocument();
  });
});
