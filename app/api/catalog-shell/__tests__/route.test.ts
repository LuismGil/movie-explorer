import { afterEach, describe, expect, it, vi } from 'vitest';

const tmdb = vi.hoisted(() => ({
  fetchPopularMovies: vi.fn(),
  fetchTrendingMovies: vi.fn(),
  searchMovies: vi.fn(),
}));

vi.mock('@/server/actions/tmdb', () => tmdb);

import { GET } from '../route';

afterEach(() => {
  vi.useRealTimers();
  vi.resetAllMocks();
  document.body.innerHTML = '';
});

describe('catalog shell WebMCP', () => {
  it('annotates the existing form and safely serializes the rendered movie data', async () => {
    const title = '</script><script>window.injected=true</script> & "Movie"';
    tmdb.searchMovies.mockResolvedValue({
      page: 1,
      total_pages: 1,
      total_results: 1,
      results: [{ id: 31, title, poster_path: null, release_date: '2020-01-01', vote_average: 8 }],
    });

    const response = await GET(new Request('http://localhost/?query=safe-serialization'));
    const html = await response.text();
    const parsed = new DOMParser().parseFromString(html, 'text/html');
    const form = parsed.querySelector('#search-form');

    expect(response.headers.get('content-type')).toContain('text/html');
    expect(form?.getAttribute('toolname')).toBe('search_movies_catalog');
    expect(form?.hasAttribute('toolautosubmit')).toBe(true);
    expect(form?.querySelector('input[name="query"]')?.getAttribute('toolparamdescription')).toBeTruthy();
    expect(parsed.querySelectorAll('script')).toHaveLength(2);
    const json = parsed.getElementById('webmcp-catalog-data')?.textContent;
    expect(JSON.parse(json!).results[0].title).toBe(title);
    expect(html).not.toContain('<script>window.injected=true</script>');
  });

  it('reports a failed catalog without exposing an upstream error', async () => {
    tmdb.searchMovies.mockRejectedValue(new Error('private upstream information'));
    const response = await GET(new Request('http://localhost/?query=unavailable-catalog'));
    const html = await response.text();
    const parsed = new DOMParser().parseFromString(html, 'text/html');
    const state = JSON.parse(parsed.getElementById('webmcp-catalog-data')!.textContent!);
    expect(state).toMatchObject({ status: 'error', results: [] });
    expect(html).not.toContain('private upstream information');
  });

  it('clears the search debounce on submit and rejects oversized agent input', async () => {
    tmdb.searchMovies.mockResolvedValue({ page: 1, total_pages: 1, total_results: 0, results: [] });
    const response = await GET(new Request('http://localhost/?query=debounce-test'));
    const parsed = new DOMParser().parseFromString(await response.text(), 'text/html');
    document.body.innerHTML = parsed.body.innerHTML;
    const script = parsed.querySelector('script:not([type])')!.textContent!;
    const form = document.querySelector<HTMLFormElement>('#search-form')!;
    const input = document.querySelector<HTMLInputElement>('#movie-search')!;
    const requestSubmit = vi.fn();
    form.requestSubmit = requestSubmit;

    vi.useFakeTimers();
    window.eval(script);
    input.value = 'new search';
    input.dispatchEvent(new Event('input', { bubbles: true }));
    form.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }));
    vi.advanceTimersByTime(500);
    expect(requestSubmit).not.toHaveBeenCalled();

    input.value = 'x'.repeat(201);
    const respondWith = vi.fn();
    const agentSubmit = new Event('submit', { bubbles: true, cancelable: true });
    Object.defineProperties(agentSubmit, {
      agentInvoked: { value: true },
      respondWith: { value: respondWith },
    });
    form.dispatchEvent(agentSubmit);
    expect(agentSubmit.defaultPrevented).toBe(true);
    const result = await respondWith.mock.calls[0][0];
    expect(result.isError).toBe(true);
    expect(JSON.parse(result.content[0].text).error.code).toBe('INVALID_ARGUMENTS');
  });
});
