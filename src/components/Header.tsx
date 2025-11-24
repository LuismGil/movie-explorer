import { Link, NavLink } from 'react-router-dom';

export function Header() {
  return (
    <header className="border-b border-ink-800/60 bg-ink-950/70 backdrop-blur">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4 md:py-5">
        <Link to="/" className="flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-accent-500 text-ink-950 font-bold shadow-lg shadow-accent-500/30">
            🎬
          </div>
          <div>
            <p className="text-lg font-semibold font-display text-white">Movie Explorer</p>
            <p className="text-xs text-slate-400">Descubra e pesquise filmes</p>
          </div>
        </Link>

        <nav className="hidden items-center gap-5 text-sm font-medium text-slate-300 md:flex">
          <NavLink
            to="/"
            className={({ isActive }) =>
              `transition hover:text-white ${isActive ? 'text-white' : ''}`
            }
          >
            Início
          </NavLink>
        </nav>
      </div>
    </header>
  );
}
