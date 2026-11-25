"use client";

import { useWebMCP } from 'use-webmcp-tool';
import {
  catalogOpenTool,
  catalogResultsTool,
  catalogSearchTool,
  getCatalogResults,
  openCatalogMovie,
  searchCatalog,
  toolError,
  type CatalogState,
  type ToolResult,
} from '../../../public/webmcp-catalog.js';

function navigate(path: string) {
  window.location.assign(path);
}

export function CatalogTools({ state }: { state: CatalogState }) {
  useWebMCP<unknown, ToolResult>({
    ...catalogSearchTool,
    execute: (input, { signal }) => signal.aborted
      ? toolError('CANCELLED', 'The operation was cancelled.')
      : searchCatalog(input, navigate),
  });
  useWebMCP<unknown, ToolResult>({
    ...catalogResultsTool,
    execute: input => getCatalogResults(state, input),
  });
  useWebMCP<unknown, ToolResult>({
    ...catalogOpenTool,
    execute: (input, { signal }) => signal.aborted
      ? toolError('CANCELLED', 'The operation was cancelled.')
      : openCatalogMovie(state, input, navigate),
  });
  return null;
}
