import 'server-only';

import {
  CallToolResultSchema,
  type CallToolResult,
} from '@modelcontextprotocol/sdk/types.js';
import type { z } from 'zod';
import { getMcpClient } from '../mcp/client';

import {
  creditsSchema,
  movieDetailsSchema,
  movieListSchema,
  movieSearchSchema,
  movieSummarySchema,
  searchAgentPlanSchema,
  searchAgentResultSchema,
  type SearchAgentCall,
  type SearchAgentResult,
} from './search-agent.schemas';

export {
  searchAgentCallSchema,
  searchAgentPlanSchema,
  searchAgentResultSchema,
  type SearchAgentCall,
  type SearchAgentPlan,
  type SearchAgentResult,
} from './search-agent.schemas';

type SuccessfulPayload = {
  movies: z.infer<typeof movieSummarySchema>[];
  details: z.infer<typeof movieDetailsSchema>[];
  credits: z.infer<typeof creditsSchema>[];
  itemCount: number;
};

type CallExecution =
  | { callIndex: number; tool: SearchAgentCall['tool']; payload: SuccessfulPayload }
  | {
      callIndex: number;
      tool: SearchAgentCall['tool'];
      reason: SearchAgentFailureReason;
    };

type SearchAgentFailureReason =
  | 'mcp_unavailable'
  | 'tool_error'
  | 'invalid_output'
  | 'request_failed';

function getArguments(call: SearchAgentCall): Record<string, unknown> {
  switch (call.tool) {
    case 'search_movies':
      return { query: call.query, ...(call.page === undefined ? {} : { page: call.page }) };
    case 'get_trending':
      return call.window ? { window: call.window } : {};
    case 'get_movie_details':
    case 'get_recommendations':
    case 'get_credits':
      return { movieId: call.movieId };
  }
}

function parseToolPayload(call: SearchAgentCall, result: CallToolResult): SuccessfulPayload {
  if (result.isError) {
    throw new Error('MCP tool reported an error');
  }

  let rawPayload: unknown = result.structuredContent;
  if (rawPayload === undefined) {
    const textBlocks = result.content.filter((block) => block.type === 'text');
    if (textBlocks.length !== 1) {
      throw new Error('MCP tool returned an invalid payload');
    }

    try {
      rawPayload = JSON.parse(textBlocks[0].text) as unknown;
    } catch {
      throw new Error('MCP tool returned invalid JSON');
    }
  }

  switch (call.tool) {
    case 'search_movies': {
      const parsed = movieSearchSchema.parse(rawPayload);
      return { movies: parsed.results, details: [], credits: [], itemCount: parsed.results.length };
    }
    case 'get_trending':
    case 'get_recommendations': {
      const parsed = movieListSchema.parse(rawPayload);
      return { movies: parsed.results, details: [], credits: [], itemCount: parsed.results.length };
    }
    case 'get_movie_details': {
      const parsed = movieDetailsSchema.parse(rawPayload);
      if (parsed.id !== Number(call.movieId)) {
        throw new Error('MCP tool returned a different movie');
      }
      return { movies: [parsed], details: [parsed], credits: [], itemCount: 1 };
    }
    case 'get_credits': {
      const parsed = creditsSchema.parse(rawPayload);
      if (parsed.id !== Number(call.movieId)) {
        throw new Error('MCP tool returned credits for a different movie');
      }
      return { movies: [], details: [], credits: [parsed], itemCount: 1 };
    }
  }
}

function mergeMovie(
  current: z.infer<typeof movieSummarySchema>,
  incoming: z.infer<typeof movieSummarySchema>,
): z.infer<typeof movieSummarySchema> {
  return movieSummarySchema.parse({
    ...current,
    overview: current.overview || incoming.overview,
    poster_path: current.poster_path ?? incoming.poster_path,
    release_date: current.release_date || incoming.release_date,
    vote_average: current.vote_average ?? incoming.vote_average,
  });
}

function mergeDetails(
  current: z.infer<typeof movieDetailsSchema>,
  incoming: z.infer<typeof movieDetailsSchema>,
): z.infer<typeof movieDetailsSchema> {
  return movieDetailsSchema.parse({
    ...current,
    ...incoming,
    overview: current.overview || incoming.overview,
    poster_path: current.poster_path ?? incoming.poster_path,
    release_date: current.release_date || incoming.release_date,
    vote_average: current.vote_average ?? incoming.vote_average,
    genres: current.genres?.length ? current.genres : incoming.genres,
    runtime: current.runtime ?? incoming.runtime,
  });
}

function mergeCredits(
  current: z.infer<typeof creditsSchema>,
  incoming: z.infer<typeof creditsSchema>,
): z.infer<typeof creditsSchema> {
  const castById = new Map(current.cast.map((member) => [member.id, member]));
  for (const member of incoming.cast) {
    const existing = castById.get(member.id);
    castById.set(member.id, existing
      ? {
          ...existing,
          name: existing.name || member.name,
          character: existing.character || member.character,
          profile_path: existing.profile_path ?? member.profile_path,
        }
      : member);
  }

  return creditsSchema.parse({
    id: current.id,
    cast: [...castById.values()],
    director: current.director ?? incoming.director,
  });
}

function failedExecution(
  callIndex: number,
  call: SearchAgentCall,
  reason: SearchAgentFailureReason,
): CallExecution {
  return { callIndex, tool: call.tool, reason };
}

function buildResult(executions: CallExecution[]): SearchAgentResult {
  const movieById = new Map<number, z.infer<typeof movieSummarySchema>>();
  const detailsById = new Map<number, z.infer<typeof movieDetailsSchema>>();
  const creditsById = new Map<number, z.infer<typeof creditsSchema>>();
  const outcomes: SearchAgentResult['outcomes'] = [];

  for (const execution of executions) {
    if ('reason' in execution) {
      outcomes.push({
        callIndex: execution.callIndex,
        tool: execution.tool,
        status: 'failed',
        reason: execution.reason,
      });
      continue;
    }

    outcomes.push({
      callIndex: execution.callIndex,
      tool: execution.tool,
      status: 'succeeded',
      itemCount: execution.payload.itemCount,
    });

    for (const movie of execution.payload.movies) {
      const existing = movieById.get(movie.id);
      movieById.set(movie.id, existing ? mergeMovie(existing, movie) : movie);
    }

    for (const details of execution.payload.details) {
      const existing = detailsById.get(details.id);
      detailsById.set(details.id, existing ? mergeDetails(existing, details) : details);
    }

    for (const credits of execution.payload.credits) {
      const existing = creditsById.get(credits.id);
      creditsById.set(credits.id, existing ? mergeCredits(existing, credits) : credits);
    }
  }

  const failedCount = outcomes.filter((outcome) => outcome.status === 'failed').length;
  const status = failedCount === 0
    ? 'complete'
    : failedCount === outcomes.length
      ? 'failed'
      : 'partial';

  return searchAgentResultSchema.parse({
    status,
    movies: [...movieById.values()],
    details: [...detailsById.values()],
    credits: [...creditsById.values()],
    outcomes,
  });
}

/** Executes an orchestrator-supplied MCP plan; it does not call TMDB or an LLM. */
export async function runSearchAgent(input: unknown): Promise<SearchAgentResult> {
  const plan = searchAgentPlanSchema.parse(input);
  let client: Awaited<ReturnType<typeof getMcpClient>>;

  try {
    client = await getMcpClient();
  } catch {
    return buildResult(plan.calls.map((call, callIndex) =>
      failedExecution(callIndex, call, 'mcp_unavailable'),
    ));
  }

  const executions = await Promise.all(plan.calls.map(async (call, callIndex): Promise<CallExecution> => {
    try {
      const response = await client.callTool({
        name: call.tool,
        arguments: getArguments(call),
      }, CallToolResultSchema);
      const parsedResult = CallToolResultSchema.safeParse(response);
      if (!parsedResult.success) {
        return failedExecution(callIndex, call, 'invalid_output');
      }

      try {
        return {
          callIndex,
          tool: call.tool,
          payload: parseToolPayload(call, parsedResult.data),
        };
      } catch {
        return failedExecution(
          callIndex,
          call,
          parsedResult.data.isError ? 'tool_error' : 'invalid_output',
        );
      }
    } catch {
      return failedExecution(callIndex, call, 'request_failed');
    }
  }));

  return buildResult(executions);
}
