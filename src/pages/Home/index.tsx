import { useEffect, useMemo, useState } from 'react';
import { useMovies } from '../../hooks/useMovies';
import { useTrendingMovies } from '../../hooks/useTrendingMovies';
import { SearchBar } from '../../components/SearchBar';
import { MovieGrid } from '../../components/MovieGrid';
import { PaginationBar } from '../../components/PaginationBar';
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

  const activeState = (isSearchActive || viewMode === 'popular')
    ? { data, isLoading, error, page, totalPages, setPage }
    : {
        data: trendingData,
        isLoading: trendingLoading,
        error: trendingError,
        page: trendingPage,
        totalPages: trendingTotalPages,
        setPage: setTrendingPage,
      };

  return (
    <div className="mx-auto flex w-full max-w-6xl flex-col gap-6 px-4 py-8">
      <SearchBar
        title={title}
        search={search}
        setSearch={setSearch}
        viewMode={viewMode}
        setViewMode={setViewMode}
        trendingWindow={trendingWindow}
        setTrendingWindow={setTrendingWindow}
        isSearchActive={isSearchActive}
      />

      {activeState.error ? (
        <ErrorState message={activeState.error} />
      ) : (
        <MovieGrid movies={activeState.data} isLoading={activeState.isLoading} />
      )}

      {!activeState.isLoading && !activeState.error && activeState.totalPages > 1 && (
        <PaginationBar
          page={activeState.page}
          totalPages={activeState.totalPages}
          setPage={activeState.setPage}
        />
      )}
    </div>
  );
}

export default HomePage;
