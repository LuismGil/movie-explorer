"use client";

import { useWebMCP } from 'use-webmcp-tool';
import { useWatchlist } from '@/context/WatchlistContext';
import { getWatchlist, watchlistTool, type ToolResult } from '../../../public/webmcp-catalog.js';

export function WatchlistTools() {
  const { watchlist, isHydrated } = useWatchlist();

  useWebMCP<unknown, ToolResult>({
    ...watchlistTool,
    enabled: isHydrated,
    execute: input => getWatchlist(watchlist, input),
  });
  return null;
}
