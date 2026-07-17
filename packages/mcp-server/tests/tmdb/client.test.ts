import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { fetchTmdb } from '@mcp/tmdb/client.js';
import { TmdbApiError, TmdbNetworkError, TmdbValidationError } from '@mcp/tmdb/errors.js';
import { z } from 'zod';

const mockSchema = z.object({ success: z.boolean() });

describe('TMDB Client', () => {
  beforeEach(() => {
    vi.stubGlobal('fetch', vi.fn());
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.clearAllMocks();
  });

  it('makes successful request and validates schema', async () => {
    vi.mocked(fetch).mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: async () => ({ success: true })
    } as Response);

    const result = await fetchTmdb('/test', mockSchema);
    expect(result.success).toBe(true);
    expect(fetch).toHaveBeenCalledTimes(1);
    const url = vi.mocked(fetch).mock.calls[0]?.[0] as string;
    expect(url).toContain('https://api.themoviedb.org/3/test');
    expect(url).toContain('api_key=');
  });

  it('throws TmdbApiError on upstream error', async () => {
    vi.mocked(fetch).mockResolvedValue({
      ok: false,
      status: 404,
    } as Response);

    await expect(fetchTmdb('/test', mockSchema)).rejects.toThrow(TmdbApiError);
    await expect(fetchTmdb('/test', mockSchema)).rejects.toHaveProperty('status', 404);
  });

  it('throws TmdbValidationError on invalid JSON', async () => {
    vi.mocked(fetch).mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: async () => { throw new Error('invalid json'); }
    } as unknown as Response);

    await expect(fetchTmdb('/test', mockSchema)).rejects.toThrow(TmdbValidationError);
  });

  it('throws TmdbValidationError on schema mismatch', async () => {
    vi.mocked(fetch).mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: async () => ({ unexpected: true })
    } as Response);

    await expect(fetchTmdb('/test', mockSchema)).rejects.toThrow(TmdbValidationError);
  });

  it('throws TmdbNetworkError on network failure', async () => {
    vi.mocked(fetch).mockRejectedValueOnce(new Error('Network offline'));

    await expect(fetchTmdb('/test', mockSchema)).rejects.toThrow(TmdbNetworkError);
  });
});
