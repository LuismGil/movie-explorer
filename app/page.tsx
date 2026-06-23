import { Suspense } from 'react';
import SearchBar from '@/components/SearchBar';
import MovieGrid from '@/components/MovieGrid';
import PaginationBar from '@/components/PaginationBar';
import { ErrorState } from '@/components/ErrorState';
import { MovieCardSkeleton } from '@/components/MovieCardSkeleton';
import {
  fetchPopularMovies,
  fetchTrendingMovies,
  searchMovies,
} from '@/server/actions/tmdb';
import { messages } from '@/i18n';

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
    errorMsg = err instanceof Error ? err.message : messages.error.fetchMovies;
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
  const viewMode = params.view === 'trending' ? 'trending' : 'popular';
  const trendingWindow = params.window === 'week' ? 'week' : 'day';

  let page = 1;
  if (params.page) {
    const parsedPage = parseInt(params.page, 10);
    if (!isNaN(parsedPage) && parsedPage > 0) {
      page = parsedPage;
    }
  }

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
