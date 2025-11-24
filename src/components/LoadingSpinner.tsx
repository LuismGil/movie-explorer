export function LoadingSpinner() {
  return (
    <div className="flex items-center justify-center py-10">
      <div className="h-10 w-10 animate-spin rounded-full border-4 border-accent-400 border-b-transparent" />
    </div>
  );
}
