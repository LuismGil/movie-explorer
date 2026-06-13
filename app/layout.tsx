import type { Metadata } from 'next';
import Header from '../src/components/Header';
import { WatchlistProvider } from '../src/context/WatchlistProvider';
import '../src/index.css';

export const metadata: Metadata = {
  title: 'Movie Explorer',
  description: 'Descubra e organize seus filmes favoritos',
};

const LAYOUT_LABELS = {
  skipLink: 'Pular para o conteúdo principal',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="pt-BR">
      <body className="min-h-screen bg-slate-950 text-slate-100 antialiased">
        <WatchlistProvider>
          <a
            href="#main-content"
            className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-50 focus:px-4 focus:py-2 focus:bg-sky-500 focus:text-white focus:rounded"
          >
            {LAYOUT_LABELS.skipLink}
          </a>
          <Header />
          <main id="main-content" tabIndex={-1} className="mx-auto w-full max-w-6xl px-4 py-6 outline-none">
            {children}
          </main>
        </WatchlistProvider>
      </body>
    </html>
  );
}
