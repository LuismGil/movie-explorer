import { Outlet } from 'react-router-dom';
import Header from './components/Header';
import { WatchlistProvider } from './context/WatchlistContext';

export default function App() {
  return (
    <WatchlistProvider>
      <div className="min-h-screen bg-slate-950 text-slate-100">
        <Header />
        <main className="mx-auto w-full max-w-6xl px-4 py-6">
          <Outlet />
        </main>
      </div>
    </WatchlistProvider>
  );
}
