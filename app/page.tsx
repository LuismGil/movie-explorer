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
import { CatalogIntro } from '@/components/CatalogIntro';
import { QRDemo } from '@/components/QRDemo';

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
    <div className="movie-grid" role="status" aria-label={messages.common.loading}>
      {Array.from({ length: 8 }).map((_, index) => (
        <MovieCardSkeleton key={`skeleton-${index}`} />
      ))}
    </div>
  );
}

function SearchBarSkeleton() {
  return (
    <div className="catalog-toolbar" aria-hidden="true">
      <div className="shimmer h-12 w-48 rounded-lg" />
      <div className="shimmer h-12 w-full max-w-md rounded-full" />
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
    <div className="catalog-page">
      <CatalogIntro />
      <section id="catalog" className="catalog-section" aria-label={messages.home.selection}>
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
      </section>
      {process.env.NODE_ENV === 'production' && <QRDemo />}
    </div>
  );
}
