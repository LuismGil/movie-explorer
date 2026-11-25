"use client";

import { useWebMCP } from 'use-webmcp-tool';
import { toolError, toolResult, type ToolResult } from '../../../public/webmcp-catalog.js';

export type CurrentMovie = {
  id: number;
  title: string;
  director: string | null;
  genres: string[];
  release_date: string;
  vote_average: number | null;
  runtime: number | null;
  overview: string | null;
};

export function MovieTools({ movie }: { movie: CurrentMovie }) {
  useWebMCP<unknown, ToolResult>({
    name: 'get_current_movie_details',
    description: 'Read the details of the movie currently open on this page.',
    inputSchema: { type: 'object', properties: {}, additionalProperties: false },
    annotations: { readOnlyHint: true, untrustedContentHint: true },
    execute: input => {
      if (!input || typeof input !== 'object' || Array.isArray(input) || Object.keys(input).length) {
        return toolError('INVALID_ARGUMENTS', 'This tool does not accept parameters.');
      }
      return toolResult(movie);
    },
  });
  return null;
}
