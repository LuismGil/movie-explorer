import { fetchTmdb } from '../tmdb/client.js';
import { handleTmdbError } from '../tmdb/errors.js';
import { movieDetailsSchema, getMovieDetailsInputSchema } from '../tmdb/schemas.js';
import { logInfo } from '@mcp/observability/logger.js';

export async function getMovieDetailsHandler(args: unknown) {
  const parsedArgs = getMovieDetailsInputSchema.safeParse(args);
  if (!parsedArgs.success) {
    throw new Error('Invalid arguments');
  }

  const { movieId } = parsedArgs.data;
  logInfo('tool_get_movie_details_start', { movieId });

  try {
    const data = await fetchTmdb(
      `/movie/${movieId}`,
      movieDetailsSchema
    );
    return {
      content: [
        {
          type: 'text' as const,
          text: JSON.stringify(data)
        }
      ]
    };
  } catch (error) {
    return handleTmdbError(error, `get_movie_details for ${movieId}`);
  }
}
