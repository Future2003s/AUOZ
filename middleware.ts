import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// ─── Route definitions ───────────────────────────────────────────────
const PROTECTED_PREFIXES = ['/admin', '/employee', '/me', '/in-don'];

const PUBLIC_PATHS = [
  '/login',
  '/register',
  '/forgot-password',
  '/reset-password',
  '/verify-email',
];

// ─── Helper functions ────────────────────────────────────────────────
function stripLocalePrefix(pathname: string): string {
  const match = pathname.match(/^\/(vi|en|ja)(\/|$)/);
  if (match) {
    return pathname.slice(match[1].length + 1) || '/';
  }
  return pathname;
}

function isPublicPath(pathWithoutLocale: string): boolean {
  return PUBLIC_PATHS.some(
    (p) => pathWithoutLocale === p || pathWithoutLocale.startsWith(p + '/')
  );
}

function isProtectedPath(pathWithoutLocale: string): boolean {
  return PROTECTED_PREFIXES.some(
    (p) => pathWithoutLocale === p || pathWithoutLocale.startsWith(p + '/')
  );
}

function getLoginUrl(request: NextRequest): URL {
  const pathname = request.nextUrl.pathname;
  const localeMatch = pathname.match(/^\/(vi|en|ja)(\/|$)/);
  const locale = localeMatch ? localeMatch[1] : 'vi';

  const loginUrl = new URL(`/${locale}/login`, request.url);

  const redirectTo = request.nextUrl.pathname + request.nextUrl.search;
  if (redirectTo && !redirectTo.includes('/login')) {
    loginUrl.searchParams.set('redirect', redirectTo);
  }
  return loginUrl;
}

// ─── Main middleware — lightweight, no JWT decode, no backend calls ──
export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const pathWithoutLocale = stripLocalePrefix(pathname);

  // 1. Public paths — allow through, redirect logged-in users away from /login
  if (isPublicPath(pathWithoutLocale)) {
    if (pathWithoutLocale === '/login') {
      const hasSession = request.cookies.has('sessionToken') || request.cookies.has('refreshToken');
      if (hasSession) {
        const localeMatch = pathname.match(/^\/(vi|en|ja)(\/|$)/);
        const locale = localeMatch ? localeMatch[1] : 'vi';
        return NextResponse.redirect(new URL(`/${locale}`, request.url));
      }
    }
    return NextResponse.next();
  }

  // 2. Protected paths — require at least one auth cookie
  if (isProtectedPath(pathWithoutLocale)) {
    const hasSession = request.cookies.has('sessionToken');
    const hasRefresh = request.cookies.has('refreshToken');

    // No cookies at all → redirect to login
    if (!hasSession && !hasRefresh) {
      return NextResponse.redirect(getLoginUrl(request));
    }

    // Has at least one cookie → let the page load
    // The page/API will handle token validation & refresh
    return NextResponse.next();
  }

  // 3. Everything else (products, homepage, etc.) → pass through
  return NextResponse.next();
}

export const config = {
  matcher: [
    // Exclude: static assets, images, api routes, icons
    // NOTE: "api" (without trailing slash) covers /api and /api/* correctly
    '/((?!_next/static|_next/image|favicon.ico|sw.js|manifest.webmanifest|api|icons|images).*)',
  ],
};
