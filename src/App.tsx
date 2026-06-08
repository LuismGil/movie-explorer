import { Outlet } from 'react-router-dom';
import Header from './components/Header';
import { WatchlistProvider } from './context/WatchlistProvider';

export default function App() {
  return (
    <WatchlistProvider>
      <div className="min-h-screen bg-slate-950 text-slate-100">
        <a
          href="#main-content"
          className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-50 focus:px-4 focus:py-2 focus:bg-sky-500 focus:text-white focus:rounded"
        >
          Skip to Main Content
        </a>
        <Header />
        <main id="main-content" tabIndex={-1} className="mx-auto w-full max-w-6xl px-4 py-6 outline-none">
          <Outlet />
        </main>
      </div>
    </WatchlistProvider>
  );
}
