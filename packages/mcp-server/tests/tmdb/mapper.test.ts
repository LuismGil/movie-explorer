import { describe, it, expect } from 'vitest';
import { mapCreditsResponse } from '@mcp/tmdb/mapper.js';

describe('TMDB Mapper', () => {
  it('maps credits response preserving IDs and extracting director', () => {
    const credits = {
      id: 123,
      cast: Array.from({ length: 15 }).map((_, i) => ({
        id: i,
        name: `Actor ${i}`,
        character: `Char ${i}`,
        profile_path: null
      })),
      crew: [
        { id: 99, name: 'John Doe', job: 'Producer', department: 'Production' },
        { id: 100, name: 'Jane Smith', job: 'Director', department: 'Directing' },
      ]
    };

    const mapped = mapCreditsResponse(credits);

    expect(mapped.id).toBe(123);
    // Preserves top 10
    expect(mapped.cast.length).toBe(10);
    expect(mapped.cast[0]?.name).toBe('Actor 0');
    // Extracts director explicitly by job
    expect(mapped.director).toBeDefined();
    expect(mapped.director?.name).toBe('Jane Smith');
  });

  it('handles absent director safely', () => {
    const credits = {
      id: 123,
      cast: [],
      crew: [
        { id: 99, name: 'John Doe', job: 'Producer', department: 'Production' },
      ]
    };

    const mapped = mapCreditsResponse(credits);
    expect(mapped.director).toBeNull();
  });
});
