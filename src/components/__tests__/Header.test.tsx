import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { Header } from '@/components/Header';
import { messages } from '@/i18n';

describe('Header', () => {
  it('renders navigation links', () => {
    render(<Header />);

    expect(screen.getByRole('link', { name: messages.navigation.home })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: messages.navigation.watchlist })).toBeInTheDocument();
  });
});
