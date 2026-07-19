import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import createMiddleware from 'next-intl/middleware';
import { routing } from './i18n/routing';

const intlMiddleware = createMiddleware(routing);

// PWA assets (manifest, icons, service worker) must be reachable at fixed,
// locale-independent URLs — the browser/OS fetches them directly, with no
// locale context. Bypass i18n routing for these instead of relying on the
// matcher regex to exclude them.
const PWA_PATHS = [/^\/icons\//, /^\/manifest\.webmanifest$/, /^\/sw\.js$/];

export default function middleware(request: NextRequest) {
  if (PWA_PATHS.some((pattern) => pattern.test(request.nextUrl.pathname))) {
    return NextResponse.next();
  }
  return intlMiddleware(request);
}

export const config = {
  matcher: ['/((?!api|_next|_vercel|.*\\..*).*)', '/icons/:path*', '/manifest.webmanifest', '/sw.js'],
};
