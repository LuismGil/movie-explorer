import { useEffect, useMemo, useState } from 'react';
import { useMovies } from '../../hooks/useMovies';
import { useTrendingMovies } from '../../hooks/useTrendingMovies';
import { MovieCard } from '../../components/MovieCard';
import { MovieCardSkeleton } from '../../components/MovieCardSkeleton';
import { ErrorState } from '../../components/ErrorState';

export function HomePage() {
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [viewMode, setViewMode] = useState<'popular' | 'trending'>('popular');
  const [trendingWindow, setTrendingWindow] = useState<'day' | 'week'>('day');
  const { data, isLoading, error, page, totalPages, setPage } = useMovies(debouncedSearch);
  const {
    data: trendingData,
    isLoading: trendingLoading,
    error: trendingError,
    page: trendingPage,
    totalPages: trendingTotalPages,
    setPage: setTrendingPage,
  } = useTrendingMovies(trendingWindow);
  const isSearchActive = debouncedSearch.trim().length > 0;

  useEffect(() => {
    const timeout = setTimeout(() => setDebouncedSearch(search), 500);
    return () => clearTimeout(timeout);
  }, [search]);

  useEffect(() => {
    if (viewMode === 'trending') {
      setTrendingPage(1);
    }
  }, [trendingWindow, viewMode, setTrendingPage]);

  const title = useMemo(() => {
    const trimmed = debouncedSearch.trim();
    if (trimmed) {
      return `Resultados para: "${trimmed}"`;
    }
    if (viewMode === 'trending') {
      return trendingWindow === 'day' ? 'Em alta hoje' : 'Em alta na semana';
    }
    return 'Filmes populares';
  }, [debouncedSearch, viewMode, trendingWindow]);

  const activeState = useMemo(() => {
    if (isSearchActive || viewMode === 'popular') {
      return { data, isLoading, error, page, totalPages, setPage };
    }
    return {
      data: trendingData,
      isLoading: trendingLoading,
      error: trendingError,
      page: trendingPage,
      totalPages: trendingTotalPages,
      setPage: setTrendingPage,
    };
  }, [
    data,
    isLoading,
    error,
    page,
    totalPages,
    setPage,
    trendingData,
    trendingLoading,
    trendingError,
    trendingPage,
    trendingTotalPages,
    setTrendingPage,
    isSearchActive,
    viewMode,
  ]);

  if (activeState.isLoading) {
    return (
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-6 px-4 py-8">
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
        {!isSearchActive ? (
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
            {viewMode === 'trending' ? (
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
            ) : null}
          </div>
        ) : null}
        <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
          {Array.from({ length: 8 }).map((_, index) => (
            <MovieCardSkeleton key={`skeleton-${index}`} />
          ))}
        </div>
      </div>
    );
  }

  if (activeState.error) {
    return (
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-6 px-4 py-8">
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
        {!isSearchActive ? (
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
            {viewMode === 'trending' ? (
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
            ) : null}
          </div>
        ) : null}
        <ErrorState message={activeState.error} />
      </div>
    );
  }

  return (
    <div className="mx-auto flex w-full max-w-6xl flex-col gap-6 px-4 py-8">
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
      {!isSearchActive ? (
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
          {viewMode === 'trending' ? (
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
          ) : null}
        </div>
      ) : null}

      {activeState.data.length === 0 ? (
        <div className="rounded-2xl border border-slate-800 bg-slate-900 px-6 py-10 text-center text-slate-200">
          Nenhum filme encontrado.
        </div>
      ) : (
        <>
          <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
            {activeState.data.map((movie) => (
              <MovieCard key={movie.id} movie={movie} />
            ))}
          </div>

          {activeState.totalPages > 1 && (
            <div className="mt-6 flex items-center justify-center gap-4">
              <button
                type="button"
                onClick={() => activeState.setPage(activeState.page - 1)}
                disabled={activeState.page === 1}
                className="rounded-full border border-slate-700 px-4 py-2 text-sm text-slate-100 disabled:opacity-40"
              >
                Anterior
              </button>
              <span className="text-sm text-slate-300">
                Página {activeState.page} de {activeState.totalPages}
              </span>
              <button
                type="button"
                onClick={() => activeState.setPage(activeState.page + 1)}
                disabled={activeState.page === activeState.totalPages}
                className="rounded-full border border-slate-700 px-4 py-2 text-sm text-slate-100 disabled:opacity-40"
              >
                Próxima
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}

export default HomePage;
