import type { Metadata } from 'next';
import localFont from 'next/font/local';
import Header from '@/components/Header';
import { WatchlistProvider } from '@/context/WatchlistProvider';
import { messages } from '@/i18n';
import { cinemaTheme } from '@/theme/cinema';
import '@/theme/fonts-full.css';
import '@/index.css';

// Complete families use disjoint Unicode ranges in fonts-full.css, without preloads.
const display = localFont({ src: '../src/theme/fonts/sora-ui.woff2', variable: '--font-display-ui', weight: '400 700', display: 'optional', adjustFontFallback: false });
const body = localFont({ src: '../src/theme/fonts/hanken-ui.woff2', variable: '--font-body-ui', weight: '400 700', display: 'swap', adjustFontFallback: false });
const mono = localFont({ src: '../src/theme/fonts/mono-ui.woff2', variable: '--font-mono-ui', weight: '500', display: 'optional', adjustFontFallback: false });

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
