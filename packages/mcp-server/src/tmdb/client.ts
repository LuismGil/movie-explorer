import { env } from '@mcp/config/env.js';
import { TmdbApiError, TmdbNetworkError, TmdbValidationError } from './errors.js';
import type { z } from 'zod';
import { logInfo, logError } from '@mcp/observability/logger.js';

const TMDB_BASE_URL = 'https://api.themoviedb.org/3';
const DEFAULT_TIMEOUT_MS = 10000;

export async function fetchTmdb<T>(
  endpoint: string,
  schema: z.ZodType<T>,
  queryParams: Record<string, string | number | boolean | undefined> = {},
  timeoutMs = DEFAULT_TIMEOUT_MS
): Promise<T> {
  const url = new URL(`${TMDB_BASE_URL}${endpoint}`);
  
  // Set default language
  url.searchParams.set('language', 'pt-BR');
  
  // Append API key server-side securely
  url.searchParams.set('api_key', env.TMDB_API_KEY);
  
  // Append additional params
  Object.entries(queryParams).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== '') {
      url.searchParams.set(key, String(value));
    }
  });

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

  const startTime = Date.now();
  let response: Response;

  try {
    response = await fetch(url.toString(), {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
      },
      signal: controller.signal,
    });
  } catch (error: unknown) {
    clearTimeout(timeoutId);
    if (error instanceof Error && error.name === 'AbortError') {
      throw new TmdbNetworkError(`Request to ${endpoint} timed out after ${timeoutMs}ms`);
    }
    throw new TmdbNetworkError(error instanceof Error ? error.message : 'Network error');
  } finally {
    clearTimeout(timeoutId);
  }

  const duration = Date.now() - startTime;

  if (!response.ok) {
    logError('tmdb_request_failed', { endpoint, status: response.status, duration });
    throw new TmdbApiError(response.status, `Upstream API returned status ${response.status}`);
  }

  let data: unknown;
  try {
    data = await response.json();
  } catch {
    logError('tmdb_invalid_json', { endpoint, duration });
    throw new TmdbValidationError('Failed to parse JSON response');
  }

  const parsed = schema.safeParse(data);
  if (!parsed.success) {
    logError('tmdb_schema_mismatch', { 
      endpoint, 
      duration,
      issues: parsed.error.issues 
    });
    throw new TmdbValidationError('Response payload incompatible with schema');
  }

  logInfo('tmdb_request_success', { endpoint, status: response.status, duration });
  return parsed.data;
}
