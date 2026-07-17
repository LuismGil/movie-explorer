import { describe, it, expect } from 'vitest';
import { 
  searchMoviesInputSchema, 
  getMovieDetailsInputSchema, 
  getTrendingInputSchema,
  paginatedResponseSchema
} from '@mcp/tmdb/schemas.js';

describe('TMDB Schemas', () => {
  describe('searchMoviesInputSchema', () => {
    it('validates a valid query', () => {
      const result = searchMoviesInputSchema.safeParse({ query: 'Inception' });
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.query).toBe('Inception');
        expect(result.data.page).toBeUndefined();
      }
    });

    it('trims whitespace from query', () => {
      const result = searchMoviesInputSchema.safeParse({ query: '  Matrix  ' });
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.query).toBe('Matrix');
      }
    });

    it('rejects empty query', () => {
      const result = searchMoviesInputSchema.safeParse({ query: '   ' });
      expect(result.success).toBe(false);
    });

    it('rejects missing query', () => {
      const result = searchMoviesInputSchema.safeParse({});
      expect(result.success).toBe(false);
    });

    it('validates page number', () => {
      const result = searchMoviesInputSchema.safeParse({ query: 'A', page: 2 });
      expect(result.success).toBe(true);
    });

    it('rejects out of bounds page', () => {
      const result = searchMoviesInputSchema.safeParse({ query: 'A', page: 1000 });
      expect(result.success).toBe(false);
    });
  });

  describe('getMovieDetailsInputSchema', () => {
    it('validates valid string movieId', () => {
      const result = getMovieDetailsInputSchema.safeParse({ movieId: '123' });
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.movieId).toBe(123);
      }
    });

    it('rejects invalid movieId format', () => {
      const result = getMovieDetailsInputSchema.safeParse({ movieId: 'abc' });
      expect(result.success).toBe(false);
    });
  });

  describe('getTrendingInputSchema', () => {
    it('defaults to day', () => {
      const result = getTrendingInputSchema.safeParse({});
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.window).toBe('day');
      }
    });

    it('accepts week', () => {
      const result = getTrendingInputSchema.safeParse({ window: 'week' });
      expect(result.success).toBe(true);
    });

    it('rejects invalid window', () => {
      const result = getTrendingInputSchema.safeParse({ window: 'month' });
      expect(result.success).toBe(false);
    });
  });

  describe('paginatedResponseSchema', () => {
    it('validates a valid response', () => {
      const data = {
        page: 1,
        results: [{
          id: 1,
          title: 'Movie',
          overview: 'Overview',
          poster_path: null,
          release_date: '2023-01-01',
          vote_average: 8.5
        }],
        total_pages: 10
      };
      const result = paginatedResponseSchema.safeParse(data);
      expect(result.success).toBe(true);
    });

    it('rejects missing fields', () => {
      const result = paginatedResponseSchema.safeParse({ page: 1, total_pages: 10 });
      expect(result.success).toBe(false);
    });
  });
});
