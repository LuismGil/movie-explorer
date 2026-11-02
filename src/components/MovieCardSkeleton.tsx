export function MovieCardSkeleton() {
  return (
    <div className="movie-card glass" aria-hidden="true">
      <div className="movie-poster shimmer" />
      <div className="movie-caption space-y-3">
        <div className="shimmer h-3 w-1/3 rounded" />
        <div className="shimmer h-5 w-3/4 rounded" />
      </div>
    </div>
  );
}

export default MovieCardSkeleton;
