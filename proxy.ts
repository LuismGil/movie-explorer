import { NextResponse, type NextRequest } from 'next/server';

/** Serve the standalone, server-rendered catalog shell for document requests. */
export function proxy(request: NextRequest) {
  if (
    request.method !== 'GET' ||
    !request.headers.get('accept')?.includes('text/html')
  ) {
    return NextResponse.next();
  }

  const destination = new URL('/api/catalog-shell', request.url);
  destination.search = request.nextUrl.search;
  return NextResponse.rewrite(destination);
}

export const config = {
  matcher: '/',
};
