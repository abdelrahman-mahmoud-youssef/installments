import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import createMiddleware from 'next-intl/middleware';
import { routing } from './i18n/routing';
import { extractTenantSlug, getRootDomain } from './lib/root-domain';

const intlMiddleware = createMiddleware(routing);

// PWA assets (manifest, icons, service worker) must be reachable at fixed,
// locale-independent URLs — the browser/OS fetches them directly, with no
// locale context. Bypass i18n routing for these instead of relying on the
// matcher regex to exclude them.
const PWA_PATHS = [
  /^\/icons\//,
  /^\/manifest\.webmanifest$/,
  /^\/sw\.js$/,
  /^\/dashboard-manifest$/,
  /^\/dashboard-icons\//,
];

function handleTenantSubdomain(request: NextRequest): NextResponse | null {
  const slug = extractTenantSlug(request.headers.get('host') ?? '', getRootDomain());
  if (!slug) {
    return null;
  }

  const { pathname } = request.nextUrl;
  const localeMatch = pathname.match(/^\/(en|ar)(\/.*)?$/);
  const locale = localeMatch?.[1] ?? null;
  const rest = localeMatch ? (localeMatch[2] || '/') : pathname;

  if (rest.startsWith('/shop/') || rest.startsWith('/customer/')) {
    return null;
  }
  const shopRest = rest === '/' ? '' : rest;
  const target = `/${locale ?? routing.defaultLocale}/shop/${slug}${shopRest}`;
  return NextResponse.rewrite(new URL(target, request.url));
}

export default function middleware(request: NextRequest) {
  if (PWA_PATHS.some((pattern) => pattern.test(request.nextUrl.pathname))) {
    return NextResponse.next();
  }
  const subdomainResponse = handleTenantSubdomain(request);
  if (subdomainResponse) {
    return subdomainResponse;
  }
  return intlMiddleware(request);
}

export const config = {
  matcher: [
    '/((?!api|_next|_vercel|.*\\..*).*)',
    '/icons/:path*',
    '/manifest.webmanifest',
    '/sw.js',
    '/dashboard-manifest',
    '/dashboard-icons/:path*',
  ],
};
