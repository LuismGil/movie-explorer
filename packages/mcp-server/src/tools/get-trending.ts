import { fetchTmdb } from '../tmdb/client.js';
import { handleTmdbError } from '../tmdb/errors.js';
import { paginatedResponseSchema, getTrendingInputSchema } from '../tmdb/schemas.js';
import { logInfo } from '@mcp/observability/logger.js';

export async function getTrendingHandler(args: unknown) {
  const parsedArgs = getTrendingInputSchema.safeParse(args);
  if (!parsedArgs.success) {
    throw new Error('Invalid arguments');
  }

  const { window } = parsedArgs.data;
  logInfo('tool_get_trending_start', { window });

  try {
    const data = await fetchTmdb(
      `/trending/movie/${window}`,
      paginatedResponseSchema
    );
    
    // As per MCP_INTERFACE.md, cap at top 20
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
    return handleTmdbError(error, `get_trending for ${window}`);
  }
}
