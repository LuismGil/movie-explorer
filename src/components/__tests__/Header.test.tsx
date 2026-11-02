import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { Header } from '@/components/Header';
import { messages } from '@/i18n';

describe('Header', () => {
  it('renders navigation links', () => {
    render(<Header />);

    expect(screen.getByRole('link', { name: messages.navigation.home })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: messages.navigation.watchlist })).toBeInTheDocument();
    expect(screen.getByRole('navigation', { name: messages.navigation.label })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: messages.navigation.home })).toHaveAttribute('aria-current', 'page');
    expect(screen.getByRole('link', { name: messages.navigation.discover })).not.toHaveAttribute('aria-current');
  });
});
