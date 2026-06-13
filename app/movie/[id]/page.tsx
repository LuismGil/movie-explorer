import Link from 'next/link';
import { notFound } from 'next/navigation';
import {
  fetchMovieDetails,
  fetchMovieVideos,
  fetchMovieCredits,
  fetchSimilarMovies,
} from '../../../src/server/actions/tmdb';
import { InfoChip } from '../../../src/components/InfoChip';
import { CastList } from '../../../src/components/CastList';
import { SimilarMovies } from '../../../src/components/SimilarMovies';
import { TrailerPlayer } from '../../../src/components/TrailerPlayer';
import { WatchlistToggle } from '../../../src/components/WatchlistToggle';
import {
  type MovieListItem,
  type MovieVideo,
  type MovieCastMember,
  type MovieDetails,
} from '../../../src/types/movie';

const TMDB_IMAGE_BASE = 'https://image.tmdb.org/t/p/w780';
const TMDB_POSTER_BASE = 'https://image.tmdb.org/t/p/w500';

interface PageProps {
  params: Promise<{
    id: string;
  }>;
}

export default async function MovieDetailsPage({ params }: PageProps) {
  const { id } = await params;

  if (!id) {
    notFound();
  }

  let data: MovieDetails | null = null;
  let videos: MovieVideo[] = [];
  let cast: MovieCastMember[] = [];
  let director: string | null = null;
  let similar: MovieListItem[] = [];

  try {
    const [details, videosResponse, credits, similarResponse] = await Promise.all([
      fetchMovieDetails(id),
      fetchMovieVideos(id),
      fetchMovieCredits(id),
      fetchSimilarMovies(id),
    ]);

    data = details;
    videos = videosResponse.results.filter(
      (video) => video.site === 'YouTube' && video.type === 'Trailer'
    );
    cast = credits.cast.slice(0, 10);
    director = credits.crew.find((member) => member.job === 'Director')?.name ?? null;
    similar = similarResponse.results;
  } catch (error) {
    console.error('Error fetching movie details:', error);
    notFound();
  }

  const backdropUrl = data.backdrop_path ? `${TMDB_IMAGE_BASE}${data.backdrop_path}` : null;
  const posterUrl = data.poster_path ? `${TMDB_POSTER_BASE}${data.poster_path}` : null;

  const compactMovie: MovieListItem = {
    id: data.id,
    title: data.title,
    poster_path: data.poster_path,
    vote_average: data.vote_average,
    release_date: data.release_date,
  };

  return (
    <div className="flex flex-col gap-10 py-6">
      <section className="relative overflow-hidden rounded-3xl border border-slate-800 bg-slate-950 shadow-2xl shadow-black/40">
        {backdropUrl ? (
          <div className="relative z-0 h-64 w-full overflow-hidden">
            <img
              src={backdropUrl}
              alt={data.title}
              width={780}
              height={439}
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
                  width={500}
                  height={750}
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
              href="/"
              className="mt-4 inline-flex items-center gap-2 rounded-full bg-slate-800 px-4 py-2 text-sm font-semibold text-slate-100 transition hover:-translate-y-0.5 hover:bg-slate-700 focus-visible:ring-2 focus-visible:ring-sky-400 focus-visible:outline-none"
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
              <WatchlistToggle movie={compactMovie} />
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
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 rounded-full bg-sky-500 px-4 py-2 text-sm font-semibold text-slate-950 shadow-lg shadow-sky-500/30 transition hover:-translate-y-0.5 hover:bg-sky-400 focus-visible:ring-2 focus-visible:ring-sky-400 focus-visible:outline-none"
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
