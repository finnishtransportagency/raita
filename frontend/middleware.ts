import type { NextRequest } from 'next/server';
import { devApiKey, devApiUrl } from 'shared/config';

/**
 * Overwrite api requests in dev environment
 */
export async function middleware(request: NextRequest) {
  if (devApiUrl && devApiKey) {
    const path = request.nextUrl.pathname;
    const apiPart = `${path.slice(path.indexOf('/api') + 4)}`;
    let newUrl = `${devApiUrl}${apiPart}`;
    const queryParams = request.nextUrl.searchParams;
    if (queryParams && queryParams.size) {
      newUrl = `${newUrl}?${decodeURIComponent(queryParams.toString())}`;
    }
    if (request.method === 'GET') {
      return await fetch(newUrl, {
        method: 'GET',
        headers: { 'x-api-key': devApiKey },
      });
    }
    if (request.method === 'POST') {
      const newBody = await request.json();
      return await fetch(newUrl, {
        method: 'POST',
        body: JSON.stringify(newBody),
        headers: { 'x-api-key': devApiKey },
      });
    }
  }
}

export const config = {
  matcher: '/api/:path*',
};
