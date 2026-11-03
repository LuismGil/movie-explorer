'use client';

import { useState } from 'react';
import { catalogMessages as messages } from '@/i18n/catalog';
import { FilmMark } from './FilmMark';

type TrailerPlayerProps = {
  videoKey: string;
};

export function TrailerPlayer({ videoKey }: TrailerPlayerProps) {
  const [loaded, setLoaded] = useState(false);
  const key = encodeURIComponent(videoKey);
  return <div className="trailer-shell">
    <div className="trailer-stage glass">
      {loaded ? <iframe
        src={`https://www.youtube-nocookie.com/embed/${key}?autoplay=1&rel=0`}
        title={messages.movie.trailerTitle}
        className="trailer-frame"
        allow="autoplay; encrypted-media; picture-in-picture"
        referrerPolicy="strict-origin-when-cross-origin"
        onLoad={event => event.currentTarget.focus()}
        allowFullScreen
      /> : <button type="button" className="trailer-load" onClick={() => setLoaded(true)}>
        <FilmMark /><span>{messages.movie.loadTrailer}</span>
      </button>}
    </div>
    <div className="trailer-caption">
      <p>{messages.movie.trailerPrivacy}</p>
      <a href={`https://www.youtube.com/watch?v=${key}`} target="_blank" rel="noopener noreferrer" className="cinema-text-link">{messages.movie.externalTrailer}</a>
    </div>
  </div>;
}

export default TrailerPlayer;
