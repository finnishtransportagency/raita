import type { NextRequest } from 'next/server';
import { devApiKey, devApiUrl } from 'shared/config';

/**
 * Overwrite api requests in dev environment
 *
 * TODO: this should only run in local dev environment
 */
export async function middleware(request: NextRequest) {
  if (devApiUrl && devApiKey) {
    const path = request.nextUrl.pathname;
    const apiPart = `${path.slice(path.indexOf('/api') + 4)}`;
    const newUrl = `${devApiUrl}${apiPart}`;
    if (request.method === 'GET') {
      return fetch(newUrl, {
        method: 'GET',
        headers: { 'x-api-key': devApiKey },
      });
    }
    if (request.method === 'POST') {
      const newBody = await request.json();
      return fetch(newUrl, {
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