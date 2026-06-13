import { Suspense } from 'react';
import SearchBar from '../src/components/SearchBar';
import MovieGrid from '../src/components/MovieGrid';
import PaginationBar from '../src/components/PaginationBar';
import { ErrorState } from '../src/components/ErrorState';
import { MovieCardSkeleton } from '../src/components/MovieCardSkeleton';
import {
  fetchPopularMovies,
  fetchTrendingMovies,
  searchMovies,
} from '../src/server/actions/tmdb';

interface PageProps {
  searchParams: Promise<{
    query?: string;
    view?: string;
    window?: string;
    page?: string;
  }>;
}

function MovieGridSkeleton() {
  return (
    <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
      {Array.from({ length: 8 }).map((_, index) => (
        <MovieCardSkeleton key={`skeleton-${index}`} />
      ))}
    </div>
  );
}

function SearchBarSkeleton() {
  return (
    <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between py-2">
      <div className="space-y-2">
        <div className="h-8 w-48 rounded bg-slate-800 animate-pulse" />
        <div className="h-4 w-64 rounded bg-slate-800 animate-pulse" />
      </div>
      <div className="h-10 w-full max-w-md rounded-full bg-slate-800 animate-pulse" />
    </div>
  );
}

async function MovieContent({
  query,
  viewMode,
  trendingWindow,
  page,
}: {
  query: string;
  viewMode: 'popular' | 'trending';
  trendingWindow: 'day' | 'week';
  page: number;
}) {
  let moviesData = null;
  let errorMsg = '';

  try {
    if (query.trim()) {
      moviesData = await searchMovies(query, page);
    } else if (viewMode === 'trending') {
      moviesData = await fetchTrendingMovies(trendingWindow, page);
    } else {
      moviesData = await fetchPopularMovies(page);
    }
  } catch (err) {
    errorMsg = err instanceof Error ? err.message : 'Erro ao buscar filmes.';
  }

  if (errorMsg) {
    return <ErrorState message={errorMsg} />;
  }

  if (!moviesData) {
    return <MovieGrid movies={[]} isLoading={false} />;
  }

  return (
    <>
      <MovieGrid movies={moviesData.results} isLoading={false} />
      {moviesData.total_pages > 1 && (
        <PaginationBar page={moviesData.page} totalPages={moviesData.total_pages} />
      )}
    </>
  );
}

export default async function HomePage({ searchParams }: PageProps) {
  const params = await searchParams;
  const query = params.query || '';
  const viewMode = (params.view as 'popular' | 'trending') || 'popular';
  const trendingWindow = (params.window as 'day' | 'week') || 'day';
  const page = params.page ? parseInt(params.page, 10) : 1;

  // Key the Suspense on parameters so that page transition/search displays loading skeleton
  const key = `${query}-${viewMode}-${trendingWindow}-${page}`;

  return (
    <div className="mx-auto flex w-full max-w-6xl flex-col gap-6 px-4 py-8">
      <Suspense fallback={<SearchBarSkeleton />}>
        <SearchBar />
      </Suspense>

      <Suspense key={key} fallback={<MovieGridSkeleton />}>
        <MovieContent
          query={query}
          viewMode={viewMode}
          trendingWindow={trendingWindow}
          page={page}
        />
      </Suspense>
    </div>
  );
}
