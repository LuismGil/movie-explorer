export function logInfo(event: string, meta?: Record<string, unknown>) {
  // eslint-disable-next-line no-console
  console.log(JSON.stringify({
    timestamp: new Date().toISOString(),
    level: 'info',
    event,
    ...meta,
  }));
}

export function logError(event: string, meta?: Record<string, unknown>) {
  // eslint-disable-next-line no-console
  console.error(JSON.stringify({
    timestamp: new Date().toISOString(),
    level: 'error',
    event,
    ...meta,
  }));
}
