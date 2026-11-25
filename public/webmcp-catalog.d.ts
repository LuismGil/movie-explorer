export type MovieSummaryInput = {
  id: number;
  title: string;
  release_date: string;
  vote_average: number;
};

export type CatalogState = {
  status: 'ok' | 'error';
  page: number;
  totalPages: number;
  results: Array<{
    id: number;
    title: string;
    release_date: string | null;
    vote_average: number | null;
  }>;
};

export type ToolResult = {
  content: Array<{ type: string; text: string }>;
  isError?: boolean;
};

type ToolDefinition = {
  name: string;
  description: string;
  inputSchema: object;
  annotations: { readOnlyHint: boolean; untrustedContentHint?: boolean };
};

export const catalogSearchTool: ToolDefinition;
export const catalogResultsTool: ToolDefinition;
export const catalogOpenTool: ToolDefinition;
export const watchlistTool: ToolDefinition;
export function toolResult(value: unknown): ToolResult;
export function toolError(code: string, message: string): ToolResult;
export function createCatalogState(input: {
  results: MovieSummaryInput[];
  page: number;
  totalPages: number;
  status: 'ok' | 'error';
}): CatalogState;
export function getCatalogResults(state: CatalogState, input: unknown): ToolResult;
export function getWatchlist(movies: unknown[], input: unknown): ToolResult;
export function searchCatalog(input: unknown, navigate: (path: string) => void): ToolResult;
export function openCatalogMovie(state: CatalogState, input: unknown, navigate: (path: string) => void): ToolResult;
export function registerShellCatalogTools(
  context: { registerTool: (tool: object, options: { signal: AbortSignal }) => Promise<void> },
  state: CatalogState,
  navigate: (path: string) => void,
): AbortController;
