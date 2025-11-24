import { useState } from 'react';
import type { FormEvent } from 'react';
import { MovieCard } from '../../components/MovieCard';
import { LoadingSpinner } from '../../components/LoadingSpinner';
import { ErrorState } from '../../components/ErrorState';
import { useMovies } from '../../hooks/useMovies';

export default function Home() {
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [query, setQuery] = useState<string>('');

  const { data, isLoading, error } = useMovies({ query });

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setQuery(searchTerm);
  };

  const movies = data?.results ?? [];

  return (
    <div className="space-y-8">
      <section className="rounded-3xl border border-ink-800/60 bg-gradient-to-br from-ink-900 via-ink-900/70 to-ink-950 px-6 py-8 shadow-xl shadow-black/30 md:px-8">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-sm uppercase tracking-[0.2em] text-accent-200/80">Descubra</p>
            <h1 className="font-display text-3xl font-semibold text-white md:text-4xl">
              Encontre seu próximo filme favorito
            </h1>
            <p className="mt-2 max-w-2xl text-slate-300">
              Pesquise por título ou explore os filmes em destaque.
            </p>
          </div>
          <div className="hidden text-right text-sm text-slate-400 md:block">
            <p>Resultados: {data?.total_results ?? '—'}</p>
            <p>Página: {data?.page ?? 1}</p>
          </div>
        </div>

        <form
          onSubmit={handleSubmit}
          className="mt-6 flex flex-col gap-3 rounded-2xl border border-ink-800/60 bg-ink-950/80 px-4 py-4 shadow-inner shadow-black/30 md:flex-row md:items-center"
        >
          <div className="flex-1">
            <label htmlFor="search" className="text-xs font-semibold uppercase text-slate-400">
              Pesquisar filmes
            </label>
            <div className="mt-2 flex items-center gap-2 rounded-xl border border-ink-800/60 bg-ink-900 px-3 py-2 focus-within:border-accent-400 focus-within:shadow-accent-500/20">
              <span className="text-lg">🔎</span>
              <input
                id="search"
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Digite o título de um filme..."
                className="w-full bg-transparent text-white outline-none placeholder:text-slate-500"
              />
            </div>
          </div>
          <button
            type="submit"
            className="rounded-xl bg-accent-500 px-5 py-3 text-sm font-semibold text-ink-950 shadow-lg shadow-accent-500/30 transition hover:-translate-y-0.5 hover:bg-accent-400"
          >
            Buscar
          </button>
        </form>
      </section>

      {isLoading ? (
        <LoadingSpinner />
      ) : error ? (
        <ErrorState message={error} onRetry={() => setQuery(searchTerm)} />
      ) : movies.length === 0 ? (
        <div className="rounded-2xl border border-ink-800/60 bg-ink-900/60 px-6 py-10 text-center text-slate-300">
          Nenhum filme encontrado. Tente outra busca.
        </div>
      ) : (
        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="font-display text-xl font-semibold text-white">
              {query ? `Resultados para "${query}"` : 'Populares agora'}
            </h2>
            <p className="text-sm text-slate-400">Total: {data?.total_results ?? '—'}</p>
          </div>
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
            {movies.map((movie) => (
              <MovieCard key={movie.id} movie={movie} />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
