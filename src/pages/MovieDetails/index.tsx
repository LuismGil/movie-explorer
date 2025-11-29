import { Link, useParams } from 'react-router-dom';
import { useMovieDetails } from '../../hooks/useMovieDetails';
import { LoadingSpinner } from '../../components/LoadingSpinner';
import { ErrorState } from '../../components/ErrorState';
import { InfoChip } from '../../components/InfoChip';
import { CastList } from '../../components/CastList';
import { SimilarMovies } from '../../components/SimilarMovies';
import { TrailerPlayer } from '../../components/TrailerPlayer';
import { useWatchlist } from '../../context/WatchlistContext';
import { type MovieListItem } from '../../types/movie';

const TMDB_IMAGE_BASE = 'https://image.tmdb.org/t/p/w780';
const TMDB_POSTER_BASE = 'https://image.tmdb.org/t/p/w500';

export function MovieDetailsPage() {
  const { id } = useParams<{ id: string }>();
  const { data, videos, cast, director, similar, isLoading, error } = useMovieDetails(id);

  if (isLoading) return <LoadingSpinner />;
  if (error || !data) return <ErrorState message={error ?? 'Filme não encontrado.'} />;

  const backdropUrl = data.backdrop_path ? `${TMDB_IMAGE_BASE}${data.backdrop_path}` : null;
  const posterUrl = data.poster_path ? `${TMDB_POSTER_BASE}${data.poster_path}` : null;
  const { isInWatchlist, toggleWatchlist } = useWatchlist();
  const inWatchlist = isInWatchlist(data.id);
  const compactMovie: MovieListItem = {
    id: data.id,
    title: data.title,
    poster_path: data.poster_path,
    vote_average: data.vote_average,
    release_date: data.release_date,
  };

  return (
    <div className="flex flex-col gap-10">
      <section className="relative overflow-hidden rounded-3xl border border-slate-800 bg-slate-950 shadow-2xl shadow-black/40">
        {backdropUrl ? (
          <div className="relative z-0 h-64 w-full overflow-hidden">
            <img
              src={backdropUrl}
              alt={data.title}
              className="h-full w-full object-cover opacity-70"
              loading="lazy"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/60" />
          </div>
        ) : (
          <div className="h-40 w-full bg-gradient-to-r from-slate-800 to-slate-900" />
        )}

        <div className="relative z-10 grid gap-8 px-6 pb-8 -mt-12 md:-mt-16 md:grid-cols-[240px,1fr] md:px-10">
          <div className="relative">
            <div className="overflow-hidden rounded-2xl border border-slate-800 shadow-xl shadow-black/40">
              {posterUrl ? (
                <img
                  src={posterUrl}
                  alt={data.title}
                  className="h-full w-full object-cover"
                  loading="lazy"
                />
              ) : (
                <div className="flex h-full min-h-[360px] items-center justify-center bg-slate-800 text-slate-400">
                  Sem imagem
                </div>
              )}
            </div>
            <Link
              to="/"
              className="mt-4 inline-flex items-center gap-2 rounded-full bg-slate-800 px-4 py-2 text-sm font-semibold text-slate-100 transition hover:-translate-y-0.5 hover:bg-slate-700"
            >
              ← Voltar
            </Link>
          </div>

          <div className="space-y-4">
            <div className="space-y-2">
              <h1 className="text-3xl font-semibold text-white">{data.title}</h1>
              <p className="text-slate-300">{data.tagline}</p>
              <div className="flex flex-wrap gap-2">
                <InfoChip label={`⭐ ${data.vote_average.toFixed(1)} (${data.vote_count ?? 0})`} />
                <InfoChip label={`Duração: ${data.runtime ?? '—'} min`} />
                <InfoChip label={`Lançamento: ${data.release_date}`} />
              </div>
              <button
                type="button"
                onClick={() => toggleWatchlist(compactMovie)}
                className="inline-flex items-center gap-2 rounded-full border border-slate-600 px-4 py-2 text-sm font-medium text-slate-100 hover:border-sky-500 hover:text-sky-400"
              >
                {inWatchlist ? 'Remover da Watchlist' : 'Adicionar à Watchlist'}
              </button>
            </div>

            <div className="space-y-2">
              <h2 className="text-lg font-semibold text-white">Sinopse</h2>
              <p className="leading-relaxed text-slate-200">{data.overview || 'Sem descrição.'}</p>
            </div>

            <div className="space-y-2">
              <h2 className="text-lg font-semibold text-white">Gêneros</h2>
              <div className="flex flex-wrap gap-2">
                {data.genres.map((genre) => (
                  <InfoChip key={genre.id} label={genre.name} />
                ))}
              </div>
            </div>

            {director ? (
              <div className="space-y-1">
                <h3 className="text-base font-semibold text-white">Diretor</h3>
                <p className="text-slate-200">{director}</p>
              </div>
            ) : null}

            {data.homepage ? (
              <a
                href={data.homepage}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-2 rounded-full bg-sky-500 px-4 py-2 text-sm font-semibold text-slate-950 shadow-lg shadow-sky-500/30 transition hover:-translate-y-0.5 hover:bg-sky-400"
              >
                Visitar site oficial ↗
              </a>
            ) : null}
          </div>
        </div>
      </section>

      {videos.length > 0 ? (
        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold text-white">Trailer</h2>
            <p className="text-sm text-slate-400">{videos[0].name}</p>
          </div>
          <TrailerPlayer videoKey={videos[0].key} />
        </section>
      ) : null}

      <section className="space-y-4">
        <h2 className="text-xl font-semibold text-white">Elenco principal</h2>
        <CastList cast={cast} />
      </section>

      <SimilarMovies movies={similar} />
    </div>
  );
}

export default MovieDetailsPage;
