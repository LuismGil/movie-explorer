import { fetchTmdb } from '../tmdb/client.js';
import { handleTmdbError } from '../tmdb/errors.js';
import { creditsResponseSchema, getCreditsInputSchema } from '../tmdb/schemas.js';
import { mapCreditsResponse } from '../tmdb/mapper.js';
import { logInfo } from '@mcp/observability/logger.js';

export async function getCreditsHandler(args: unknown) {
  const parsedArgs = getCreditsInputSchema.safeParse(args);
  if (!parsedArgs.success) {
    throw new Error('Invalid arguments');
  }

  const { movieId } = parsedArgs.data;
  logInfo('tool_get_credits_start', { movieId });

  try {
    const data = await fetchTmdb(
      `/movie/${movieId}/credits`,
      creditsResponseSchema
    );
    
    const mapped = mapCreditsResponse(data);

    return {
      content: [
        {
          type: 'text' as const,
          text: JSON.stringify(mapped)
        }
      ]
    };
  } catch (error) {
    return handleTmdbError(error, `get_credits for ${movieId}`);
  }
}
