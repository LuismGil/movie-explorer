import { fetchTmdb } from '../tmdb/client.js';
import { handleTmdbError } from '../tmdb/errors.js';
import { paginatedResponseSchema, searchMoviesInputSchema } from '../tmdb/schemas.js';
import { logInfo } from '@mcp/observability/logger.js';

export async function searchMoviesHandler(args: unknown) {
  const parsedArgs = searchMoviesInputSchema.safeParse(args);
  if (!parsedArgs.success) {
    throw new Error('Invalid arguments');
  }

  const { query, page = 1 } = parsedArgs.data;
  logInfo('tool_search_movies_start', { query, page });

  try {
    const data = await fetchTmdb(
      '/search/movie',
      paginatedResponseSchema,
      { query, page }
    );
    return {
      content: [
        {
          type: 'text' as const,
          text: JSON.stringify({
            results: data.results,
            total_pages: data.total_pages
          })
        }
      ]
    };
  } catch (error) {
    return handleTmdbError(error, 'search_movies');
  }
}
