import type { CreditsResponse } from './schemas.js';

export function mapCreditsResponse(credits: CreditsResponse) {
  // Get top 10 cast
  const topCast = credits.cast.slice(0, 10);
  
  // Find director
  const director = credits.crew.find((member) => member.job === 'Director') || null;

  return {
    id: credits.id,
    cast: topCast,
    director: director,
  };
}
