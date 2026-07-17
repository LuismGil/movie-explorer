import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { CallToolRequestSchema, ListToolsRequestSchema, McpError, ErrorCode } from '@modelcontextprotocol/sdk/types.js';
import { searchMoviesHandler } from '../tools/search-movies.js';
import { getMovieDetailsHandler } from '../tools/get-movie-details.js';
import { getRecommendationsHandler } from '../tools/get-recommendations.js';
import { getTrendingHandler } from '../tools/get-trending.js';
import { getCreditsHandler } from '../tools/get-credits.js';

export async function createMcpServer() {
  const server = new Server({
    name: 'movie-explorer-mcp',
    version: '1.0.0',
  }, {
    capabilities: {
      tools: {}
    }
  });
  
  server.setRequestHandler(
    ListToolsRequestSchema,
    async () => ({
      tools: [
        {
          name: 'search_movies',
          description: 'Search for movies by title or query string.',
          inputSchema: {
            type: 'object',
            properties: {
              query: { type: 'string', description: 'Search query' },
              page: { type: 'number', description: 'Page number' }
            },
            required: ['query']
          }
        },
        {
          name: 'get_movie_details',
          description: 'Retrieve comprehensive details of a movie by its TMDB ID.',
          inputSchema: {
            type: 'object',
            properties: {
              movieId: { type: 'string', description: 'TMDB Movie ID' }
            },
            required: ['movieId']
          }
        },
        {
          name: 'get_recommendations',
          description: 'Fetch recommended or similar movies for a given movie ID.',
          inputSchema: {
            type: 'object',
            properties: {
              movieId: { type: 'string', description: 'TMDB Movie ID' }
            },
            required: ['movieId']
          }
        },
        {
          name: 'get_trending',
          description: 'Get trending movies over a specified time window.',
          inputSchema: {
            type: 'object',
            properties: {
              window: { type: 'string', enum: ['day', 'week'], description: 'Time window (day or week)' }
            }
          }
        },
        {
          name: 'get_credits',
          description: 'Get members of the cast and key crew members (Director) for a movie.',
          inputSchema: {
            type: 'object',
            properties: {
              movieId: { type: 'string', description: 'TMDB Movie ID' }
            },
            required: ['movieId']
          }
        }
      ]
    })
  );

  server.setRequestHandler(
    CallToolRequestSchema,
    async (request) => {
      switch (request.params.name) {
        case 'search_movies':
          return await searchMoviesHandler(request.params.arguments);
        case 'get_movie_details':
          return await getMovieDetailsHandler(request.params.arguments);
        case 'get_recommendations':
          return await getRecommendationsHandler(request.params.arguments);
        case 'get_trending':
          return await getTrendingHandler(request.params.arguments);
        case 'get_credits':
          return await getCreditsHandler(request.params.arguments);
        default:
          throw new McpError(ErrorCode.MethodNotFound, `Tool not found: ${request.params.name}`);
      }
    }
  );

  return server;
}
