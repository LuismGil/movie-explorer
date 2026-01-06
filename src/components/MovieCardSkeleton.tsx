export function MovieCardSkeleton() {
  return (
    <div className="animate-pulse overflow-hidden rounded-2xl border border-slate-800 bg-slate-900">
      <div className="aspect-[2/3] w-full bg-slate-800" />
      <div className="space-y-2 px-4 py-3">
        <div className="h-4 w-3/4 rounded bg-slate-800" />
        <div className="h-3 w-1/3 rounded bg-slate-800" />
      </div>
    </div>
  );
}

export default MovieCardSkeleton;
