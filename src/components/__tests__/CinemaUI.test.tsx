import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { ErrorBoundary } from '../ErrorBoundary';
import { QRDemo } from '../QRDemo';
import { CatalogIntro } from '../CatalogIntro';
import { messages } from '@/i18n';

vi.mock('qrcode.react', () => ({
  QRCodeSVG: ({ value, title }: { value: string; title: string }) => <svg role="img" aria-label={title} data-value={value} />,
}));

afterEach(() => { cleanup(); vi.unstubAllEnvs(); });

describe('cinema presentation', () => {
  it('keeps the catalog and the gated AI demo as distinct navigation actions', () => {
    render(<CatalogIntro />);
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent(messages.home.heroTitle);
    expect(screen.getByRole('link', { name: messages.home.heroAction })).toHaveAttribute('href', '#catalog');
    expect(screen.getByRole('link', { name: messages.home.aiAction })).toHaveAttribute('href', '/discover');
    expect(screen.getByText(messages.home.aiHint)).toBeInTheDocument();
  });

  it('offers an explicit route-boundary reset without leaking exception data', () => {
    const reset = vi.fn();
    render(<ErrorBoundary reset={reset} />);
    expect(screen.getByRole('alert')).toHaveTextContent(messages.error.cinemaTitle);
    fireEvent.click(screen.getByRole('button', { name: messages.error.retry }));
    expect(reset).toHaveBeenCalledTimes(1);
    expect(screen.getByRole('link', { name: messages.common.backToCatalog })).toHaveAttribute('href', '/');
  });

  it('hides the QR demo outside production', () => {
    vi.stubEnv('NODE_ENV', 'development');
    const { container } = render(<QRDemo />);
    expect(container).toBeEmptyDOMElement();
  });

  it('encodes only the current origin plus gated Discover, not query/path or a third-party QR service', () => {
    vi.stubEnv('NODE_ENV', 'production');
    render(<QRDemo />);
    expect(screen.getByRole('img', { name: messages.qr.codeTitle })).toHaveAttribute('data-value', `${window.location.origin}/discover`);
    expect(screen.getByRole('link', { name: messages.qr.link })).toHaveAttribute('href', '/discover');
    expect(screen.getByText(messages.qr.description)).toBeInTheDocument();
  });
});
