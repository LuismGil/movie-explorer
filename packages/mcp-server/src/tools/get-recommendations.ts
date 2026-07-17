import { fetchTmdb } from '../tmdb/client.js';
import { handleTmdbError } from '../tmdb/errors.js';
import { paginatedResponseSchema, getRecommendationsInputSchema } from '../tmdb/schemas.js';
import { logInfo } from '@mcp/observability/logger.js';

export async function getRecommendationsHandler(args: unknown) {
  const parsedArgs = getRecommendationsInputSchema.safeParse(args);
  if (!parsedArgs.success) {
    throw new Error('Invalid arguments');
  }

  const { movieId } = parsedArgs.data;
  logInfo('tool_get_recommendations_start', { movieId });

  try {
    const data = await fetchTmdb(
      `/movie/${movieId}/recommendations`,
      paginatedResponseSchema
    );
    
    // As per MCP_INTERFACE.md, cap at top 20, which is naturally 1 page in TMDB
    return {
      content: [
        {
          type: 'text' as const,
          text: JSON.stringify({
            results: data.results.slice(0, 20)
          })
        }
      ]
    };
  } catch (error) {
    return handleTmdbError(error, `get_recommendations for ${movieId}`);
  }
}
