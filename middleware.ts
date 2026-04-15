import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// ─── Config ──────────────────────────────────────────────────────────
const LOCALES = ['vi', 'en', 'ja'] as const;
type Locale = (typeof LOCALES)[number];
const DEFAULT_LOCALE: Locale = 'vi';

const PROTECTED_PREFIXES = ['/admin', '/employee', '/me', '/in-don'];

const PUBLIC_PATHS = [
  '/login',
  '/register',
  '/forgot-password',
  '/reset-password',
  '/verify-email',
];

// Paths that should NEVER be processed by locale/redirect logic
const BYPASS_PREFIXES = [
  '/_next',
  '/api',
  '/icons',
  '/images',
  '/favicon.ico',
  '/sw.js',
  '/manifest.webmanifest',
  '/browserconfig.xml',
  '/robots.txt',
  '/sitemap.xml',
];

// ─── Helpers ─────────────────────────────────────────────────────────
function isLocale(segment: string): segment is Locale {
  return (LOCALES as readonly string[]).includes(segment);
}

/** Returns the locale prefix from a pathname, or null if none */
function getLocaleFromPath(pathname: string): Locale | null {
  const first = pathname.split('/').filter(Boolean)[0];
  return first && isLocale(first) ? first : null;
}

/** Strips the locale prefix and returns the plain path */
function stripLocale(pathname: string): string {
  const segs = pathname.split('/').filter(Boolean);
  if (segs.length > 0 && isLocale(segs[0])) {
    return '/' + segs.slice(1).join('/');
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

function getPreferredLocale(request: NextRequest): Locale {
  // 1. Check cookie (user explicitly picked a language)
  const cookieLocale = request.cookies.get('NEXT_LOCALE')?.value;
  if (cookieLocale && isLocale(cookieLocale)) return cookieLocale;

  // 2. Check Accept-Language header — pick first matching locale
  const acceptLang = request.headers.get('accept-language') ?? '';
  for (const part of acceptLang.split(',')) {
    const tag = part.trim().split(';')[0].toLowerCase();
    if (tag.startsWith('ja')) return 'ja';
    if (tag.startsWith('en')) return 'en';
    if (tag.startsWith('vi')) return 'vi';
  }

  // 3. Default
  return DEFAULT_LOCALE;
}

function makeLoginUrl(request: NextRequest, locale: Locale): URL {
  const loginUrl = new URL(`/${locale}/login`, request.url);
  const redirectTo = request.nextUrl.pathname + request.nextUrl.search;
  if (redirectTo && !redirectTo.includes('/login')) {
    loginUrl.searchParams.set('redirect', redirectTo);
  }
  return loginUrl;
}

// ─── Main middleware ──────────────────────────────────────────────────
export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // ── 0. Hard bypass — never touch these paths ──────────────────────
  if (BYPASS_PREFIXES.some((prefix) => pathname.startsWith(prefix))) {
    return NextResponse.next();
  }

  const existingLocale = getLocaleFromPath(pathname);
  const pathWithoutLocale = stripLocale(pathname);

  // ── 1. Root path "/" ─────────────────────────────────────────────
  //    Redirect to /{preferredLocale}/
  if (pathname === '/') {
    const locale = getPreferredLocale(request);
    return NextResponse.redirect(new URL(`/${locale}`, request.url), 308);
  }

  // ── 2. Path has NO locale prefix ─────────────────────────────────
  //    e.g. /contact → /vi/contact, /products/slug → /vi/products/slug
  if (!existingLocale) {
    const locale = getPreferredLocale(request);
    const destination = new URL(`/${locale}${pathname}${request.nextUrl.search}`, request.url);
    return NextResponse.redirect(destination, 308);
  }

  // ── 3. Path HAS locale prefix ────────────────────────────────────
  //    Apply auth protection, etc.
  const locale = existingLocale;

  // Public paths (login, register…)
  if (isPublicPath(pathWithoutLocale)) {
    if (pathWithoutLocale === '/login') {
      const hasSession =
        request.cookies.has('sessionToken') || request.cookies.has('refreshToken');
      if (hasSession) {
        return NextResponse.redirect(new URL(`/${locale}`, request.url));
      }
    }
    return NextResponse.next();
  }

  // Protected paths (/admin, /employee, /me, /in-don)
  if (isProtectedPath(pathWithoutLocale)) {
    const hasSession = request.cookies.has('sessionToken');
    const hasRefresh = request.cookies.has('refreshToken');
    if (!hasSession && !hasRefresh) {
      return NextResponse.redirect(makeLoginUrl(request, locale));
    }
    return NextResponse.next();
  }

  // Everything else → pass through
  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match ALL paths EXCEPT:
     *  - _next/static  (static chunks, fonts, etc.)
     *  - _next/image   (image optimisation)
     *  - favicon.ico
     */
    '/((?!_next/static|_next/image|favicon.ico).*)',
  ],
};
