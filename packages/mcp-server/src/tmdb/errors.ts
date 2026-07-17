import { ErrorCode, McpError } from '@modelcontextprotocol/sdk/types.js';
import { logError } from '@mcp/observability/logger.js';

export class TmdbApiError extends Error {
  constructor(public status: number, message: string) {
    super(message);
    this.name = 'TmdbApiError';
  }
}

export class TmdbNetworkError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'TmdbNetworkError';
  }
}

export class TmdbValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'TmdbValidationError';
  }
}

export function handleTmdbError(error: unknown, context: string): never {
  if (error instanceof TmdbApiError) {
    logError('tmdb_api_error', { context, status: error.status });
    throw new McpError(
      ErrorCode.InternalError,
      `TMDB API Error: Received status ${error.status} for ${context}`
    );
  }
  if (error instanceof TmdbNetworkError) {
    logError('tmdb_network_error', { context, message: error.message });
    throw new McpError(
      ErrorCode.InternalError,
      `TMDB Network Error: Failed to communicate with upstream for ${context}`
    );
  }
  if (error instanceof TmdbValidationError) {
    logError('tmdb_validation_error', { context, message: error.message });
    throw new McpError(
      ErrorCode.InternalError,
      `TMDB Validation Error: Unexpected response format for ${context}`
    );
  }
  
  logError('tmdb_unknown_error', { context, message: error instanceof Error ? error.message : 'Unknown' });
  throw new McpError(
    ErrorCode.InternalError,
    `Unknown Error occurred during ${context}`
  );
}
