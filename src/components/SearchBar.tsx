interface SearchBarProps {
  title: string;
  search: string;
  setSearch: (value: string) => void;
  viewMode: 'popular' | 'trending';
  setViewMode: (mode: 'popular' | 'trending') => void;
  trendingWindow: 'day' | 'week';
  setTrendingWindow: (window: 'day' | 'week') => void;
  isSearchActive: boolean;
}

export function SearchBar({
  title,
  search,
  setSearch,
  viewMode,
  setViewMode,
  trendingWindow,
  setTrendingWindow,
  isSearchActive,
}: SearchBarProps) {
  return (
    <>
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div className="space-y-2">
          <h1 className="text-3xl font-semibold text-white">{title}</h1>
          <p className="text-slate-400">Busque por filmes ou navegue pelos populares.</p>
        </div>
        <div className="w-full max-w-md">
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar filmes..."
            className="w-full rounded-full border border-slate-700 bg-slate-900 px-4 py-2 text-sm text-slate-100 placeholder:text-slate-500 focus:border-sky-500 focus:outline-none focus:ring-1 focus:ring-sky-500"
          />
        </div>
      </div>
      {!isSearchActive && (
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2 rounded-full border border-slate-800 bg-slate-900 p-1">
            <button
              type="button"
              onClick={() => setViewMode('popular')}
              className={`rounded-full px-3 py-1.5 text-xs font-semibold transition ${
                viewMode === 'popular'
                  ? 'bg-sky-500 text-slate-950'
                  : 'text-slate-300 hover:text-white'
              }`}
            >
              Populares
            </button>
            <button
              type="button"
              onClick={() => setViewMode('trending')}
              className={`rounded-full px-3 py-1.5 text-xs font-semibold transition ${
                viewMode === 'trending'
                  ? 'bg-sky-500 text-slate-950'
                  : 'text-slate-300 hover:text-white'
              }`}
            >
              Trending
            </button>
          </div>
          {viewMode === 'trending' && (
            <div className="flex items-center gap-2 rounded-full border border-slate-800 bg-slate-900 p-1">
              <button
                type="button"
                onClick={() => setTrendingWindow('day')}
                className={`rounded-full px-3 py-1.5 text-xs font-semibold transition ${
                  trendingWindow === 'day'
                    ? 'bg-slate-800 text-slate-100'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                Hoje
              </button>
              <button
                type="button"
                onClick={() => setTrendingWindow('week')}
                className={`rounded-full px-3 py-1.5 text-xs font-semibold transition ${
                  trendingWindow === 'week'
                    ? 'bg-slate-800 text-slate-100'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                Semana
              </button>
            </div>
          )}
        </div>
      )}
    </>
  );
}

export default SearchBar;
