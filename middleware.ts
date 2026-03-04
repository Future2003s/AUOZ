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
  '/test-login',
];

// Paths that should bypass middleware entirely
const BYPASS_PATHS = [
  '/sw.js',
  '/manifest.webmanifest',
  '/api/',
  '/_next/',
  '/icons/',
  '/images/',
  '/favicon.ico',
];

// ─── JWT helpers (Edge runtime compatible — NO Buffer!) ─────────────
function decodeJwtPayload(token: string): { exp?: number; id?: string } | null {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) return null;
    // base64url → base64 → decode (Edge-compatible, no Buffer needed)
    const base64 = parts[1].replace(/-/g, '+').replace(/_/g, '/');
    const jsonStr = decodeURIComponent(
      atob(base64)
        .split('')
        .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
        .join('')
    );
    return JSON.parse(jsonStr);
  } catch {
    return null;
  }
}

function isTokenExpired(token: string, bufferSeconds = 60): boolean {
  const payload = decodeJwtPayload(token);
  if (!payload?.exp) return true;
  return Date.now() >= (payload.exp - bufferSeconds) * 1000;
}

// ─── Token refresh helper ────────────────────────────────────────────
async function tryRefreshToken(
  refreshToken: string
): Promise<{ token: string; refreshToken?: string } | null> {
  const baseUrl =
    process.env.NEXT_PUBLIC_API_END_POINT || 'http://localhost:8081/api/v1';

  // AbortController with 5s timeout to prevent hanging
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 5000);

  try {
    const res = await fetch(`${baseUrl}/auth/refresh-token`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refreshToken }),
      signal: controller.signal,
    });

    if (!res.ok) return null;

    const contentType = res.headers.get('content-type') || '';
    if (!contentType.includes('application/json')) return null;

    const text = await res.text();
    const data = text ? JSON.parse(text) : {};

    const newToken =
      data?.data?.token || data?.data?.accessToken || data?.token;
    if (!newToken) return null;

    return {
      token: newToken,
      refreshToken: data?.data?.refreshToken,
    };
  } catch {
    return null;
  } finally {
    clearTimeout(timeout);
  }
}

// ─── Helper functions ────────────────────────────────────────────────
function stripLocalePrefix(pathname: string): string {
  // Remove locale prefix like /vi, /en, /ja
  const match = pathname.match(/^\/(vi|en|ja)(\/|$)/);
  if (match) {
    return pathname.slice(match[1].length + 1) || '/';
  }
  return pathname;
}

function isBypassPath(pathname: string): boolean {
  return BYPASS_PATHS.some((p) => pathname.startsWith(p) || pathname === p);
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

function getLoginUrl(request: NextRequest, reason?: string): URL {
  // Detect locale from the original URL
  const pathname = request.nextUrl.pathname;
  const localeMatch = pathname.match(/^\/(vi|en|ja)(\/|$)/);
  const locale = localeMatch ? localeMatch[1] : 'vi';

  const loginUrl = new URL(`/${locale}/login`, request.url);

  // Anti-redirect-loop: only add redirect param if not already going to login
  const redirectTo = request.nextUrl.pathname + request.nextUrl.search;
  if (redirectTo && !redirectTo.includes('/login')) {
    loginUrl.searchParams.set('redirect', redirectTo);
  }
  if (reason) {
    loginUrl.searchParams.set('reason', reason);
  }
  return loginUrl;
}

// ─── Main middleware ─────────────────────────────────────────────────
export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // 1. Bypass static files, API routes, Next.js internals
  if (isBypassPath(pathname)) {
    return NextResponse.next();
  }

  // 2. Get path without locale prefix for route matching
  const pathWithoutLocale = stripLocalePrefix(pathname);

  // 3. Public paths — no auth needed
  if (isPublicPath(pathWithoutLocale)) {
    // If user is already logged in and visits /login, redirect to home
    const sessionToken = request.cookies.get('sessionToken')?.value;
    if (sessionToken && !isTokenExpired(sessionToken) && pathWithoutLocale === '/login') {
      const localeMatch = pathname.match(/^\/(vi|en|ja)(\/|$)/);
      const locale = localeMatch ? localeMatch[1] : 'vi';
      return NextResponse.redirect(new URL(`/${locale}`, request.url));
    }
    return NextResponse.next();
  }

  // 4. Protected paths — require auth
  if (isProtectedPath(pathWithoutLocale)) {
    const sessionToken = request.cookies.get('sessionToken')?.value;
    const refreshTokenCookie = request.cookies.get('refreshToken')?.value;

    // No tokens at all → redirect to login
    if (!sessionToken && !refreshTokenCookie) {
      return NextResponse.redirect(getLoginUrl(request));
    }

    // Has sessionToken and it's still valid → allow
    if (sessionToken && !isTokenExpired(sessionToken)) {
      return NextResponse.next();
    }

    // Token expired or missing but refresh token exists → try refresh
    if (refreshTokenCookie) {
      const refreshResult = await tryRefreshToken(refreshTokenCookie);

      if (refreshResult) {
        // Refresh succeeded — set new cookies and allow
        const response = NextResponse.next();
        const isProd = process.env.NODE_ENV === 'production';

        response.cookies.set('sessionToken', refreshResult.token, {
          httpOnly: true,
          sameSite: 'lax',
          secure: isProd,
          path: '/',
          maxAge: 60 * 60 * 24 * 30, // 30 days
        });

        if (refreshResult.refreshToken) {
          response.cookies.set('refreshToken', refreshResult.refreshToken, {
            httpOnly: true,
            sameSite: 'strict',
            secure: isProd,
            path: '/',
            maxAge: 60 * 60 * 24 * 365, // 1 year
          });
        }

        return response;
      }

      // Refresh failed → redirect to login
      const response = NextResponse.redirect(getLoginUrl(request, 'expired'));
      // Clear stale cookies
      response.cookies.set('sessionToken', '', { maxAge: 0, path: '/' });
      response.cookies.set('refreshToken', '', { maxAge: 0, path: '/' });
      return response;
    }

    // Has sessionToken but expired, no refreshToken → redirect
    return NextResponse.redirect(getLoginUrl(request, 'expired'));
  }

  // 5. Non-protected, non-public pages → pass through (products, homepage, etc.)
  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    '/((?!_next/static|_next/image|favicon.ico).*)',
  ],
};
