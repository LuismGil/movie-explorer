import { MovieCard } from '../../components/MovieCard';
import { useWatchlist } from '../../context/WatchlistContext';

export function WatchlistPage() {
  const { watchlist } = useWatchlist();

  return (
    <div className="space-y-4">
      <h1 className="mb-4 text-2xl font-semibold text-slate-50">Minha Watchlist</h1>

      {watchlist.length === 0 ? (
        <p className="text-sm text-slate-300">
          Você ainda não adicionou nenhum filme à watchlist.
        </p>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
          {watchlist.map((movie) => (
            <MovieCard key={movie.id} movie={movie} />
          ))}
        </div>
      )}
    </div>
  );
}

export default WatchlistPage;
