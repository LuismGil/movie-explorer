import type { Metadata } from 'next';
import { Sora, Hanken_Grotesk, JetBrains_Mono } from 'next/font/google';
import Header from '@/components/Header';
import { WatchlistProvider } from '@/context/WatchlistProvider';
import { messages } from '@/i18n';
import { cinemaTheme } from '@/theme/cinema';
import '@/index.css';

const display = Sora({ subsets: ['latin'], variable: '--font-display', display: 'optional' });
const body = Hanken_Grotesk({ subsets: ['latin'], variable: '--font-body', display: 'swap' });
const mono = JetBrains_Mono({ subsets: ['latin'], weight: '500', variable: '--font-mono', display: 'optional', preload: false });

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
    <html lang="pt-BR" className={`${display.variable} ${body.variable} ${mono.variable}`} style={cinemaTheme}>
      <body className="min-h-screen bg-void font-body text-text-hi antialiased">
        <WatchlistProvider>
          <a
            href="#main-content"
            className="skip-link"
          >
            {messages.common.skipToContent}
          </a>
          <Header />
          <main id="main-content" tabIndex={-1} className="site-main outline-none">
            {children}
          </main>
          <footer className="site-footer">
            <span>{messages.navigation.appTitle}</span>
            <p>{messages.common.catalogAttribution}</p>
          </footer>
        </WatchlistProvider>
      </body>
    </html>
  );
}
