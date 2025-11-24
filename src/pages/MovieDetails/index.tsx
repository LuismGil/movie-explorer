import { Link, useParams } from 'react-router-dom';
import { useMovieDetails } from '../../hooks/useMovieDetails';
import { LoadingSpinner } from '../../components/LoadingSpinner';
import { ErrorState } from '../../components/ErrorState';
import { InfoChip } from '../../components/InfoChip';

const TMDB_IMAGE_BASE = 'https://image.tmdb.org/t/p/w780';

export default function MovieDetails() {
  const { id } = useParams<{ id: string }>();
  const { data, isLoading, error } = useMovieDetails(id);

  if (isLoading) return <LoadingSpinner />;
  if (error || !data) return <ErrorState message={error ?? 'Filme não encontrado.'} />;

  const backdropUrl = data.backdrop_path ? `${TMDB_IMAGE_BASE}${data.backdrop_path}` : null;
  const posterUrl = data.poster_path ? `${TMDB_IMAGE_BASE}${data.poster_path}` : null;

  return (
    <article className="overflow-hidden rounded-3xl border border-ink-800/60 bg-ink-900/60 shadow-2xl shadow-black/40">
      {backdropUrl ? (
        <div className="relative h-64 w-full overflow-hidden">
          <img
            src={backdropUrl}
            alt={data.title}
            className="h-full w-full object-cover opacity-70"
            loading="lazy"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-ink-950 via-ink-950/60" />
        </div>
      ) : (
        <div className="h-40 w-full bg-gradient-to-r from-ink-800 to-ink-900" />
      )}

      <div className="grid gap-8 px-6 pb-8 md:grid-cols-[240px,1fr] md:px-10 md:-mt-24">
        <div className="relative">
          <div className="overflow-hidden rounded-2xl border border-ink-800 shadow-xl shadow-black/40">
            {posterUrl ? (
              <img
                src={posterUrl}
                alt={data.title}
                className="h-full w-full object-cover"
                loading="lazy"
              />
            ) : (
              <div className="flex h-full min-h-[360px] items-center justify-center bg-ink-800 text-slate-400">
                Sem imagem
              </div>
            )}
          </div>
          <Link
            to="/"
            className="mt-4 inline-flex items-center gap-2 rounded-full bg-ink-800/80 px-4 py-2 text-sm font-semibold text-slate-100 transition hover:-translate-y-0.5 hover:bg-ink-700"
          >
            ← Voltar
          </Link>
        </div>

        <div className="space-y-4">
          <div className="space-y-2">
            <h1 className="font-display text-3xl font-semibold text-white">{data.title}</h1>
            <p className="text-slate-300">{data.tagline}</p>
            <div className="flex flex-wrap gap-2">
              <InfoChip label={`⭐ ${data.vote_average.toFixed(1)} (${data.vote_count ?? 0})`} />
              <InfoChip label={`Duração: ${data.runtime} min`} />
              <InfoChip label={`Lançamento: ${data.release_date}`} />
            </div>
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

          {data.homepage ? (
            <a
              href={data.homepage}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-2 rounded-full bg-accent-500 px-4 py-2 text-sm font-semibold text-ink-950 shadow-lg shadow-accent-500/30 transition hover:-translate-y-0.5 hover:bg-accent-400"
            >
              Visitar site oficial ↗
            </a>
          ) : null}
        </div>
      </div>
    </article>
  );
}
