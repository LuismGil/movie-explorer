const key = process.env.TMDB_API_KEY;
if (!key) {
  console.error('TMDB live check: GitHub Actions did not provide TMDB_API_KEY.');
  process.exitCode = 1;
} else {
  const url = new URL('https://api.themoviedb.org/3/movie/popular');
  url.search = new URLSearchParams({ language: 'pt-BR', page: '1', api_key: key });
  try {
    const response = await fetch(url, { redirect: 'error', signal: AbortSignal.timeout(12000) });
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    const { results } = await response.json();
    if (!Array.isArray(results) || !results.some(movie => typeof movie?.poster_path === 'string' && movie.poster_path.length > 0)) {
      throw new Error('No movie posters in response');
    }
    console.log('TMDB live check: popular movies with posters returned.');
  } catch (error) {
    const status = /^HTTP \d{3}$/.test(error?.message) ? ` (${error.message})` : '';
    console.error(`TMDB live check failed${status}; no request URL or credentials logged.`);
    process.exitCode = 1;
  }
}
