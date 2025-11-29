import { Link, NavLink } from 'react-router-dom';

export function Header() {
  return (
    <header className="sticky top-0 z-20 border-b border-slate-800 bg-slate-950/80 backdrop-blur">
      <div className="mx-auto flex w-full max-w-6xl items-center justify-between gap-4 px-4 py-3">
        <Link to="/" className="text-lg font-semibold text-slate-100 transition hover:text-sky-400">
          🎬 Movie Explorer
        </Link>
        <nav className="flex items-center gap-3">
          <NavLink
            to="/"
            className={({ isActive }) =>
              `text-sm font-medium transition hover:text-sky-400 ${
                isActive ? 'font-semibold text-sky-400' : 'text-slate-300'
              }`
            }
          >
            Início
          </NavLink>
          <NavLink
            to="/watchlist"
            className={({ isActive }) =>
              `text-sm font-medium transition hover:text-sky-400 ${
                isActive ? 'font-semibold text-sky-400' : 'text-slate-300'
              }`
            }
          >
            Watchlist
          </NavLink>
        </nav>
      </div>
    </header>
  );
}

export default Header;
