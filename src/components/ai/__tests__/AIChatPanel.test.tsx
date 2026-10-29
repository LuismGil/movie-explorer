import { TextDecoder, TextEncoder } from 'node:util';
import { act, cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { AIChatPanel } from '../AIChatPanel';
import { messages } from '@/i18n';
import { approvedPresentation, ndjson, progressEvents, resultEvent } from '@/lib/ai/__tests__/fixtures';

const copy = messages.ai;
const response = (events: unknown[]) => new Response(ndjson(events), { headers: { 'Content-Type': 'application/x-ndjson' } });
function submit(message = 'Find Example') {
  fireEvent.change(screen.getByLabelText(copy.label), { target: { value: message } });
  fireEvent.click(screen.getByRole('button', { name: copy.submit }));
}

describe('AIChatPanel', () => {
  let fetch: ReturnType<typeof vi.fn<typeof globalThis.fetch>>;
  beforeEach(() => {
    vi.stubGlobal('TextEncoder', TextEncoder); vi.stubGlobal('TextDecoder', TextDecoder);
    fetch = vi.fn<typeof globalThis.fetch>().mockResolvedValue(response([...progressEvents, resultEvent]));
    vi.stubGlobal('fetch', fetch);
  });
  afterEach(() => { cleanup(); vi.unstubAllGlobals(); vi.useRealTimers(); });

  it('makes no requests on mount and explains disabled activation honestly', () => {
    render(<AIChatPanel enabled={false} />);
    expect(screen.getByText(copy.disabled)).toBeInTheDocument();
    expect(screen.getByLabelText(copy.label)).toBeDisabled();
    expect(screen.getByRole('button', { name: copy.submit })).toBeDisabled();
    expect(screen.getByRole('link', { name: copy.browse })).toHaveAttribute('href', '/');
    expect(screen.queryByText(copy.coldStartHint)).not.toBeInTheDocument();
    expect(fetch).not.toHaveBeenCalled();
  });

  it('sets a calm expectation for free-tier startup only when AI search is available', () => {
    render(<AIChatPanel enabled />);
    expect(screen.getByText(copy.coldStartHint)).toBeInTheDocument();
    expect(fetch).not.toHaveBeenCalled();
  });

  it('submits only the user request and renders approved data as escaped text', async () => {
    const presentation = { ...approvedPresentation, movies: [{ ...approvedPresentation.movies[0], overview: '[link](javascript:attack)' }] };
    fetch.mockResolvedValue(response([...progressEvents, { ...resultEvent, presentation }]));
    render(<AIChatPanel enabled />);
    submit();
    expect(await screen.findByRole('heading', { name: approvedPresentation.movies[0].title })).toBeInTheDocument();
    expect(fetch).toHaveBeenCalledTimes(1);
    expect(fetch).toHaveBeenCalledWith('/api/ai/search', expect.objectContaining({ method: 'POST', body: JSON.stringify({ message: 'Find Example' }), signal: expect.any(AbortSignal) }));
    expect(screen.getByText('[link](javascript:attack)')).toBeInTheDocument();
    expect(screen.queryByRole('link', { name: 'link' })).not.toBeInTheDocument();
    expect(screen.getByRole('link', { name: copy.details })).toHaveAttribute('href', '/movie/42');
  });

  it('shows real controlled progress, but does not render a result until stream EOF', async () => {
    let stream!: ReadableStreamDefaultController<Uint8Array>;
    const body = new ReadableStream<Uint8Array>({ start(controller) { stream = controller; } });
    fetch.mockResolvedValue(new Response(body, { headers: { 'Content-Type': 'application/x-ndjson' } }));
    render(<AIChatPanel enabled />);
    submit();
    expect(screen.getByRole('button', { name: copy.cancel })).toBeInTheDocument();
    await act(async () => { stream.enqueue(new TextEncoder().encode(ndjson([progressEvents[0]]))); });
    expect(screen.getByRole('status')).toHaveTextContent(copy.stages.planning);
    await act(async () => { stream.enqueue(new TextEncoder().encode(ndjson([...progressEvents.slice(1), resultEvent]))); });
    expect(screen.queryByRole('heading', { name: approvedPresentation.movies[0].title })).not.toBeInTheDocument();
    await act(async () => { stream.close(); });
    expect(await screen.findByRole('heading', { name: approvedPresentation.movies[0].title })).toBeInTheDocument();
  });

  it.each([
    { type: 'error', code: 'quota_exceeded' }, { type: 'error', code: 'disabled' }, { type: 'error', code: 'timeout' },
    { type: 'error', code: 'unsafe_result' }, { type: 'unsupported' },
  ])('renders controlled terminal state with no automatic retry: %j', async terminal => {
    fetch.mockResolvedValue(response([terminal]));
    render(<AIChatPanel enabled />); submit();
    const text = terminal.type === 'unsupported' ? copy.unsupported : copy.errors[terminal.code as keyof typeof copy.errors];
    expect(await screen.findByText(text)).toBeInTheDocument();
    expect(fetch).toHaveBeenCalledTimes(1);
    expect(screen.queryByRole('heading', { name: approvedPresentation.movies[0].title })).not.toBeInTheDocument();
  });

  it('renders successful empty and partial states distinctly', async () => {
    fetch.mockResolvedValueOnce(response([...progressEvents, { ...resultEvent, presentation: { ...approvedPresentation, status: 'empty', movies: [] } }]))
      .mockResolvedValueOnce(response([...progressEvents, { ...resultEvent, presentation: { ...approvedPresentation, status: 'partial', issues: [{ code: 'partial_search' }] } }]));
    render(<AIChatPanel enabled />); submit();
    expect(await screen.findByText(copy.empty)).toBeInTheDocument();
    submit('another title');
    expect(await screen.findByText(copy.partial)).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: approvedPresentation.movies[0].title })).toBeInTheDocument();
  });

  it('continues title clarification with a chosen verified ID and the original message', async () => {
    fetch.mockResolvedValueOnce(response([...progressEvents, { ...resultEvent, status: 'needs_selection' }]))
      .mockResolvedValueOnce(response([...progressEvents, resultEvent]));
    render(<AIChatPanel enabled />); submit('Who directed Example?');
    const select = await screen.findByRole('button', { name: copy.select(approvedPresentation.movies[0].title) });
    fireEvent.change(screen.getByLabelText(copy.label), { target: { value: 'Edited draft' } });
    fireEvent.click(select);
    await waitFor(() => expect(fetch).toHaveBeenCalledTimes(2));
    expect(JSON.parse(fetch.mock.calls[1][1]!.body as string)).toEqual({ message: 'Who directed Example?', referenceMovieId: 42 });
  });

  it('discards even an initially valid terminal if private trailing frames arrive', async () => {
    fetch.mockResolvedValue(response([...progressEvents, resultEvent, { raw: 'private model prose' }]));
    render(<AIChatPanel enabled />); submit();
    expect(await screen.findByText(copy.errors.invalid_stream)).toBeInTheDocument();
    expect(screen.queryByRole('heading', { name: approvedPresentation.movies[0].title })).not.toBeInTheDocument();
    expect(screen.queryByText('private model prose')).not.toBeInTheDocument();
  });

  it('supports explicit retry without an automatic second call', async () => {
    fetch.mockResolvedValueOnce(response([{ type: 'error', code: 'unavailable' }])).mockResolvedValueOnce(response([...progressEvents, resultEvent]));
    render(<AIChatPanel enabled />); submit();
    fireEvent.click(await screen.findByRole('button', { name: copy.retry }));
    expect(await screen.findByRole('heading', { name: approvedPresentation.movies[0].title })).toBeInTheDocument();
    expect(fetch).toHaveBeenCalledTimes(2);
  });

  it('cancels, suppresses late responses, and allows a new request', async () => {
    let finish!: (value: Response) => void;
    fetch.mockImplementationOnce(() => new Promise(resolve => { finish = resolve; })).mockResolvedValueOnce(response([...progressEvents, resultEvent]));
    render(<AIChatPanel enabled />); submit();
    const firstSignal = fetch.mock.calls[0][1]!.signal!;
    fireEvent.click(screen.getByRole('button', { name: copy.cancel }));
    expect(firstSignal.aborted).toBe(true);
    expect(screen.getByText(copy.errors.cancelled)).toBeInTheDocument();
    await act(async () => { finish(response([...progressEvents, resultEvent])); });
    expect(screen.queryByRole('heading', { name: approvedPresentation.movies[0].title })).not.toBeInTheDocument();
    submit('new request');
    expect(await screen.findByRole('heading', { name: approvedPresentation.movies[0].title })).toBeInTheDocument();
  });

  it('bounds client waiting even when fetch ignores cancellation', async () => {
    vi.useFakeTimers();
    fetch.mockImplementation(() => new Promise(() => {}));
    render(<AIChatPanel enabled />); submit();
    await act(async () => { await vi.advanceTimersByTimeAsync(35000); });
    expect(screen.getByText(copy.errors.timeout)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: copy.submit })).toBeEnabled();
  });

  it('aborts and removes timers on unmount', () => {
    vi.useFakeTimers();
    fetch.mockImplementation(() => new Promise(() => {}));
    const view = render(<AIChatPanel enabled />); submit();
    const signal = fetch.mock.calls[0][1]!.signal!;
    view.unmount();
    expect(signal.aborted).toBe(true);
    expect(vi.getTimerCount()).toBe(0);
  });

  it('honors Retry-After without automatic retries and cleans up the cooldown timer', async () => {
    vi.useFakeTimers();
    fetch.mockResolvedValue(new Response(ndjson([{ type: 'error', code: 'rate_limited' }]), {
      status: 429, headers: { 'Content-Type': 'application/x-ndjson', 'Retry-After': '60' },
    }));
    const view = render(<AIChatPanel enabled />);
    await act(async () => { submit(); });
    expect(screen.getByText(copy.errors.rate_limited)).toBeInTheDocument();
    expect(screen.getByText(copy.rateLimitWait(60))).toBeInTheDocument();
    expect(screen.getByRole('button', { name: copy.submit })).toBeDisabled();
    expect(screen.queryByRole('button', { name: copy.retry })).not.toBeInTheDocument();
    await act(async () => { await vi.advanceTimersByTimeAsync(59_999); });
    expect(screen.getByRole('button', { name: copy.submit })).toBeDisabled();
    await act(async () => { await vi.advanceTimersByTimeAsync(1); });
    expect(screen.getByRole('button', { name: copy.submit })).toBeEnabled();
    expect(screen.getByRole('button', { name: copy.retry })).toBeInTheDocument();
    expect(fetch).toHaveBeenCalledTimes(1);
    await act(async () => { fireEvent.click(screen.getByRole('button', { name: copy.retry })); });
    view.unmount();
    expect(vi.getTimerCount()).toBe(0);
  });

  it.each(['', '-1', '86401', 'Infinity', 'private'])('uses a bounded default cooldown for an invalid Retry-After: %s', async retryAfter => {
    vi.useFakeTimers();
    fetch.mockResolvedValue(new Response(ndjson([{ type: 'error', code: 'rate_limited' }]), {
      status: 429, headers: { 'Content-Type': 'application/x-ndjson', 'Retry-After': retryAfter },
    }));
    render(<AIChatPanel enabled />);
    await act(async () => { submit(); });
    expect(screen.getByText(copy.rateLimitWait(60))).toBeInTheDocument();
    expect(screen.getByRole('button', { name: copy.submit })).toBeDisabled();
    expect(fetch).toHaveBeenCalledTimes(1);
  });
});
