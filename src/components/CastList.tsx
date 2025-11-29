import type { MovieCastMember } from '../types/movie';

type CastListProps = {
  cast: MovieCastMember[];
};

const PROFILE_BASE = 'https://image.tmdb.org/t/p/w185';

export function CastList({ cast }: CastListProps) {
  return (
    <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
      {cast.map((member) => {
        const profileUrl = member.profile_path ? `${PROFILE_BASE}${member.profile_path}` : null;
        return (
          <div
            key={member.id}
            className="rounded-xl bg-slate-900 p-4 text-center text-sm shadow border border-slate-800"
          >
            <div className="mx-auto mb-3 h-24 w-24 overflow-hidden rounded-full bg-slate-800">
              {profileUrl ? (
                <img
                  src={profileUrl}
                  alt={member.name}
                  className="h-full w-full object-cover"
                  loading="lazy"
                />
              ) : (
                <div className="flex h-full items-center justify-center text-slate-400">Sem foto</div>
              )}
            </div>
            <p className="font-semibold text-slate-100">{member.name}</p>
            <p className="text-xs text-slate-400">{member.character ?? '—'}</p>
          </div>
        );
      })}
    </div>
  );
}

export default CastList;
