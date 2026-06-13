import type { Metadata } from 'next';
import Header from '@/components/Header';
import { WatchlistProvider } from '@/context/WatchlistProvider';
import { messages } from '@/i18n';
import '@/index.css';

export const metadata: Metadata = {
  title: 'Movie Explorer',
  description: 'Descubra e organize seus filmes favoritos',
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
            {messages.common.skipToContent}
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
