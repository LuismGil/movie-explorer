// Shared by the standalone catalog shell and the React catalog.
// This module contains no movie data or server credentials.

const pageInputSchema = {
  type: 'object',
  properties: {
    offset: { type: 'integer', minimum: 0, maximum: 10000, description: 'Starting item in the current list.' },
    limit: { type: 'integer', minimum: 1, maximum: 5, description: 'Maximum number of items to return.' },
  },
  additionalProperties: false,
};

export const catalogSearchTool = {
  name: 'search_movies_catalog',
  description: 'Search the catalog by movie title and navigate to the results. An empty query shows popular movies.',
  inputSchema: {
    type: 'object',
    properties: { query: { type: 'string', maxLength: 200, description: 'Movie title or search terms.' } },
    additionalProperties: false,
  },
  annotations: { readOnlyHint: false },
};

export const catalogResultsTool = {
  name: 'get_catalog_results',
  description: 'Read the movies displayed on the current catalog page.',
  inputSchema: pageInputSchema,
  annotations: { readOnlyHint: true, untrustedContentHint: true },
};

export const catalogOpenTool = {
  name: 'open_movie_details',
  description: 'Open the detail page of a movie displayed in the current catalog.',
  inputSchema: {
    type: 'object',
    properties: { movieId: { type: 'integer', minimum: 1, description: 'Movie ID from the current catalog results.' } },
    required: ['movieId'],
    additionalProperties: false,
  },
  annotations: { readOnlyHint: false },
};

export const watchlistTool = {
  name: 'get_watchlist',
  description: 'Read movies saved in this browser on the watchlist page.',
  inputSchema: pageInputSchema,
  annotations: { readOnlyHint: true, untrustedContentHint: true },
};

export function toolResult(value) {
  return { content: [{ type: 'text', text: JSON.stringify(value) }] };
}

export function toolError(code, message) {
  return { ...toolResult({ error: { code, message } }), isError: true };
}

function isInput(input, allowedKeys) {
  return input !== null && typeof input === 'object' && !Array.isArray(input)
    && Object.keys(input).every(key => allowedKeys.includes(key));
}

function pagination(input) {
  if (!isInput(input, ['offset', 'limit'])) return null;
  const offset = input.offset === undefined ? 0 : input.offset;
  const limit = input.limit === undefined ? 5 : input.limit;
  if (!Number.isSafeInteger(offset) || offset < 0 || offset > 10000
    || !Number.isSafeInteger(limit) || limit < 1 || limit > 5) return null;
  return { offset, limit };
}

function movieSummary(movie) {
  if (!movie || typeof movie !== 'object' || !Number.isSafeInteger(movie.id)
    || movie.id < 1 || typeof movie.title !== 'string' || !movie.title.trim()) return null;
  return {
    id: movie.id,
    title: movie.title.trim().slice(0, 120),
    release_date: typeof movie.release_date === 'string' ? movie.release_date.slice(0, 10) : null,
    vote_average: typeof movie.vote_average === 'number' && Number.isFinite(movie.vote_average)
      && movie.vote_average >= 0 && movie.vote_average <= 10 ? movie.vote_average : null,
  };
}

function validMovies(movies) {
  return Array.isArray(movies) ? movies.map(movieSummary).filter(Boolean) : [];
}

export function createCatalogState({ results, page, totalPages, status }) {
  return {
    status: status === 'error' ? 'error' : 'ok',
    page: Number.isSafeInteger(page) && page > 0 ? page : 1,
    totalPages: Number.isSafeInteger(totalPages) && totalPages > 0 ? totalPages : 1,
    results: status === 'error' ? [] : validMovies(results),
  };
}

function paginatedResult(movies, input, extra = {}) {
  const range = pagination(input);
  if (!range) return toolError('INVALID_ARGUMENTS', 'Use a non-negative offset and a limit between 1 and 5.');
  const items = movies.slice(range.offset, range.offset + range.limit);
  const nextOffset = range.offset + items.length < movies.length ? range.offset + items.length : null;
  return toolResult({ ...extra, items, count: movies.length, next_offset: nextOffset });
}

export function getCatalogResults(state, input) {
  if (state.status === 'error') {
    return toolError('CATALOG_UNAVAILABLE', 'The catalog could not be loaded. Try again later.');
  }
  return paginatedResult(state.results, input, { page: state.page, total_pages: state.totalPages });
}

export function getWatchlist(movies, input) {
  return paginatedResult(validMovies(movies), input);
}

export function searchCatalog(input, navigate) {
  if (!isInput(input, ['query']) || (input.query !== undefined && typeof input.query !== 'string')
    || (typeof input.query === 'string' && input.query.length > 200)) {
    return toolError('INVALID_ARGUMENTS', 'Provide a movie title of up to 200 characters.');
  }
  const query = (input.query ?? '').trim();
  const params = new URLSearchParams({ query });
  try {
    navigate(query ? `/?${params.toString()}` : '/');
  } catch {
    return toolError('NAVIGATION_FAILED', 'The catalog could not be opened.');
  }
  return toolResult({ status: 'navigation_started' });
}

export function openCatalogMovie(state, input, navigate) {
  if (!isInput(input, ['movieId']) || !Number.isSafeInteger(input.movieId) || input.movieId < 1) {
    return toolError('INVALID_ARGUMENTS', 'Provide a valid movie ID from the current catalog.');
  }
  if (state.status === 'error' || !state.results.some(movie => movie.id === input.movieId)) {
    return toolError('MOVIE_NOT_IN_CATALOG', 'Choose a movie from the current catalog results.');
  }
  try {
    navigate(`/movie/${input.movieId}`);
  } catch {
    return toolError('NAVIGATION_FAILED', 'The movie page could not be opened.');
  }
  return toolResult({ status: 'navigation_started', movie_id: input.movieId });
}

export function registerShellCatalogTools(context, state, navigate) {
  const controller = new AbortController();
  const options = { signal: controller.signal };
  const registrations = [
    { ...catalogResultsTool, execute: async (input, execution) => execution?.signal?.aborted
      ? toolError('CANCELLED', 'The operation was cancelled.') : getCatalogResults(state, input) },
    { ...catalogOpenTool, execute: async (input, execution) => execution?.signal?.aborted
      ? toolError('CANCELLED', 'The operation was cancelled.') : openCatalogMovie(state, input, navigate) },
  ];
  Promise.all(registrations.map(tool => Promise.resolve().then(() => context.registerTool(tool, options)))).catch(() => {
    controller.abort();
    console.warn('WebMCP catalog tools could not be registered.');
  });
  return controller;
}
