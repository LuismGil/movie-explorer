import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { getMcpClient, closeMcpClient } from '../client';
import { getMcpEnv } from '../../env/mcp';
import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { StreamableHTTPClientTransport } from '@modelcontextprotocol/sdk/client/streamableHttp.js';

vi.mock('../../env/mcp', () => ({
  getMcpEnv: vi.fn(),
}));

vi.mock('@modelcontextprotocol/sdk/client/index.js', () => {
  return {
    Client: vi.fn(function() {
      return {
        connect: vi.fn().mockResolvedValue(undefined),
        close: vi.fn().mockResolvedValue(undefined),
      };
    })
  };
});

vi.mock('@modelcontextprotocol/sdk/client/streamableHttp.js', () => {
  return {
    StreamableHTTPClientTransport: vi.fn(),
  };
});

describe('MCP Client Adapter', () => {
  beforeEach(async () => {
    await closeMcpClient(); // reset singleton
    vi.clearAllMocks();
    vi.mocked(getMcpEnv).mockReturnValue({
      MCP_SERVER_URL: 'http://127.0.0.1:3001/mcp', MCP_INTERNAL_API_KEY: 'test-key',
    });
  });
  afterEach(() => { vi.useRealTimers(); vi.restoreAllMocks(); });

  it('initializes transport with bearer token and connects', async () => {
    vi.mocked(getMcpEnv).mockReturnValue({
      MCP_SERVER_URL: 'http://127.0.0.1:3001/mcp',
      MCP_INTERNAL_API_KEY: 'test-key',
    });

    const client = await getMcpClient();

    expect(getMcpEnv).toHaveBeenCalled();
    expect(StreamableHTTPClientTransport).toHaveBeenCalledWith(
      new URL('http://127.0.0.1:3001/mcp'),
      {
        requestInit: {
          headers: {
            'Authorization': 'Bearer test-key'
          },
          redirect: 'error',
        }
      }
    );
    expect(Client).toHaveBeenCalled();
    
    // Check singleton behavior
    const client2 = await getMcpClient();
    expect(client).toBe(client2);
    expect(Client).toHaveBeenCalledTimes(1);
  });

  it('shares a pending initialization without returning a half-connected client', async () => {
    let finish!: () => void;
    const connect = vi.fn(() => new Promise<void>(resolve => { finish = resolve; }));
    const fake = { connect, close: vi.fn().mockResolvedValue(undefined) };
    vi.mocked(Client).mockImplementationOnce(function () { return fake as unknown as Client; });
    let settled = false;
    const first = getMcpClient();
    const second = getMcpClient().then(client => { settled = true; return client; });
    await vi.waitFor(() => expect(connect).toHaveBeenCalledTimes(1));
    expect(settled).toBe(false);
    expect(Client).toHaveBeenCalledTimes(1);
    finish();
    expect(await first).toBe(await second);
    expect(connect).toHaveBeenCalledWith(expect.anything(), {
      signal: expect.any(AbortSignal), timeout: 20000, maxTotalTimeout: 20000,
    });
  });

  it('allows an observed cold-start handshake within the extended initialization bound', async () => {
    vi.useFakeTimers();
    let finish!: () => void;
    const connect = vi.fn(() => new Promise<void>(resolve => { finish = resolve; }));
    const fake = { connect, close: vi.fn().mockResolvedValue(undefined) };
    vi.mocked(Client).mockImplementationOnce(function () { return fake as unknown as Client; });

    const pending = getMcpClient();
    await vi.advanceTimersByTimeAsync(0);
    expect(connect).toHaveBeenCalledTimes(1);
    await vi.advanceTimersByTimeAsync(15_000);
    expect(fake.close).not.toHaveBeenCalled();
    finish();
    await expect(pending).resolves.toBe(fake);
    expect(vi.getTimerCount()).toBe(0);
  });

  it('lets one caller cancel without aborting shared initialization for other callers', async () => {
    let finish!: () => void;
    const connect = vi.fn(() => new Promise<void>(resolve => { finish = resolve; }));
    const fake = { connect, close: vi.fn().mockResolvedValue(undefined) };
    vi.mocked(Client).mockImplementationOnce(function () { return fake as unknown as Client; });
    const controller = new AbortController();
    const first = getMcpClient({ signal: controller.signal });
    const cancellation = expect(first).rejects.toThrow('Operation aborted');
    const second = getMcpClient();
    await vi.waitFor(() => expect(connect).toHaveBeenCalledTimes(1));
    controller.abort('private');
    await cancellation;
    expect(fake.close).not.toHaveBeenCalled();
    finish();
    expect(await second).toBe(fake);
  });

  it('never initializes for a pre-aborted caller', async () => {
    await expect(getMcpClient({ signal: AbortSignal.abort() })).rejects.toThrow('Operation aborted');
    expect(Client).not.toHaveBeenCalled();
  });

  it('clears failed initialization and allows a later request to reconnect without logging secrets', async () => {
    const log = vi.spyOn(console, 'error').mockImplementation(() => {});
    const fake = { connect: vi.fn().mockRejectedValue(new Error('Bearer private-key')), close: vi.fn().mockResolvedValue(undefined) };
    vi.mocked(Client).mockImplementationOnce(function () { return fake as unknown as Client; });
    await expect(getMcpClient()).rejects.toThrow('Failed to establish connection with the MCP backend.');
    expect(fake.connect).toHaveBeenCalledTimes(1);
    expect(fake.close).toHaveBeenCalledTimes(1);
    expect(JSON.stringify(log.mock.calls)).not.toContain('private-key');
    await expect(getMcpClient()).resolves.toBeDefined();
    expect(Client).toHaveBeenCalledTimes(2);
  });

  it('bounds all of initialization even if connect ignores its SDK timeout', async () => {
    vi.useFakeTimers();
    vi.spyOn(console, 'error').mockImplementation(() => {});
    const fake = { connect: vi.fn(() => new Promise<void>(() => {})), close: vi.fn().mockResolvedValue(undefined) };
    vi.mocked(Client).mockImplementationOnce(function () { return fake as unknown as Client; });
    const pending = expect(getMcpClient()).rejects.toThrow('Failed to establish connection');
    await vi.advanceTimersByTimeAsync(20000);
    await pending;
    expect(fake.close).toHaveBeenCalledTimes(1);
    expect(vi.getTimerCount()).toBe(0);
  });

  it('invalidates a disconnected singleton for the next request', async () => {
    const client = await getMcpClient();
    client.onclose?.();
    const next = await getMcpClient();
    expect(next).not.toBe(client);
    expect(Client).toHaveBeenCalledTimes(2);
  });
});
