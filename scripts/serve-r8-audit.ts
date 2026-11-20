import { createServer } from 'node:http';
import { resolve } from 'node:path';
import { build } from 'esbuild';
import { ndjson, progressEvents, resultEvent } from '../src/lib/ai/__tests__/fixtures';

const root = resolve(import.meta.dirname, '..');
const scenarios = ['selection', 'error', 'quota', 'cancel'];
const bundle = await build({
  absWorkingDir: root,
  stdin: {
    resolveDir: root,
    loader: 'tsx',
    contents: `
      import { createRoot } from 'react-dom/client';
      import { Header } from './src/components/Header';
      import { MovieCard } from './src/components/MovieCard';
      import { AIChatPanel } from './src/components/ai/AIChatPanel';
      import { WatchlistProvider } from './src/context/WatchlistProvider';
      import WatchlistPage from './app/watchlist/page';
      import { approvedPresentation } from './src/lib/ai/__tests__/fixtures';
      const path = window.location.pathname;
      const movie = approvedPresentation.movies[0];
      createRoot(document.getElementById('root')).render(
        <WatchlistProvider>
          <a href="#main-content">Pular para o conteúdo principal</a>
          <Header />
          <main id="main-content" tabIndex={-1}>
            {path === '/watchlist' ? <WatchlistPage /> :
              path.startsWith('/movie/') ? <h1>{movie.title}</h1> :
              path === '/discover' ? <AIChatPanel enabled /> :
              <><h1>Catálogo de teste</h1><MovieCard movie={movie} /></>}
          </main>
        </WatchlistProvider>
      );
    `,
  },
  bundle: true, write: false, outfile: '/virtual/r8.js', jsx: 'automatic',
  define: { 'process.env.NODE_ENV': '"production"' },
  plugins: [{
    name: 'browser-fixture-routing',
    setup(builder) {
      builder.onResolve({ filter: /^next\/(link|navigation)$/ }, args => ({ path: args.path, namespace: 'fixture' }));
      builder.onLoad({ filter: /.*/, namespace: 'fixture' }, args => ({
        resolveDir: root,
        contents: args.path === 'next/link'
          ? `import { createElement } from 'react';
             export default function Link({ prefetch, ...props }) { return createElement('a', props); }`
          : 'export const usePathname = () => window.location.pathname;',
      }));
    },
  }],
});
const assets = new Map(bundle.outputFiles.map(file => [file.path.split('/').at(-1), file.text]));

function getScenario(referer: string | undefined, url: URL) {
  if (!referer || !URL.canParse(referer, url)) return null;
  const page = new URL(referer, url);
  return page.origin === url.origin ? page.searchParams.get('scenario') : null;
}

const server = createServer((req, res) => {
  const url = new URL(req.url ?? '/', 'http://127.0.0.1:4088');
  res.setHeader('Cache-Control', 'no-store');
  res.setHeader('Content-Security-Policy', "default-src 'none'; script-src 'self'; style-src 'self' 'unsafe-inline'; connect-src 'self'; img-src 'self' data:; base-uri 'none'; form-action 'self'");
  if (url.pathname === '/api/ai/search' && req.method === 'POST') {
    req.resume(); // The fixture neither needs nor stores the submitted text.
    const scenario = getScenario(req.headers.referer, url);
    res.setHeader('Content-Type', 'application/x-ndjson');
    if (scenario === 'quota') {
      res.writeHead(429, { 'Retry-After': '15' });
      res.end(ndjson([{ type: 'error', code: 'rate_limited' }]));
    } else if (scenario === 'error') {
      res.end(ndjson([{ type: 'error', code: 'unavailable' }]));
    } else {
      res.write(ndjson([progressEvents[0]]));
      const timers = progressEvents.slice(1).map((event, index) =>
        setTimeout(() => res.write(ndjson([event])), 1400 * (index + 1)));
      if (scenario !== 'cancel') {
        timers.push(setTimeout(() => res.write(ndjson([{ ...resultEvent, status: 'needs_selection' }])), 5600));
        timers.push(setTimeout(() => res.end(), 8400));
      }
      res.on('close', () => timers.forEach(clearTimeout));
    }
    return;
  }
  const asset = assets.get(url.pathname.slice(1));
  if (asset !== undefined) {
    res.setHeader('Content-Type', url.pathname.endsWith('.css') ? 'text/css' : 'text/javascript');
    res.end(asset);
    return;
  }
  if (!['/', '/watchlist', '/discover', '/movie/42'].includes(url.pathname)) {
    res.writeHead(404).end();
    return;
  }
  const links = scenarios.map(scenario => `<a href="/discover?scenario=${scenario}">${scenario}</a>`).join(' · ');
  res.setHeader('Content-Type', 'text/html; charset=utf-8');
  res.end(`<!doctype html><html lang="pt-BR"><meta charset="utf-8"><title>Movie Explorer — teste R8</title>
    <link rel="stylesheet" href="/r8.css"><div id="root"></div>
    <aside aria-label="Cenários de teste">Cenários simulados de IA: ${links}</aside><script src="/r8.js"></script></html>`);
});

server.listen(4088, '127.0.0.1', () => console.log('R8 offline: http://127.0.0.1:4088'));
