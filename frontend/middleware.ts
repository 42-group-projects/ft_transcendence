import { NextRequest, NextResponse } from 'next/server';

const TOKEN_COOKIE_KEY = 'access_token';

const PUBLIC_PATHS = new Set(['/', '/login', '/signup', '/terms', '/privacy']);

export function middleware(request: NextRequest) {
    const { pathname } = request.nextUrl;

    if (PUBLIC_PATHS.has(pathname)) {
        return NextResponse.next();
    }

    const token = request.cookies.get(TOKEN_COOKIE_KEY)?.value;

    if (!token) {
        const redirectUrl = request.nextUrl.clone();
        redirectUrl.pathname = '/';
        redirectUrl.search = '';
        return NextResponse.redirect(redirectUrl);
    }

    return NextResponse.next();
}

export const config = {
    // Exclude /api so proxied API calls (e.g. unauthenticated /api/auth/login)
    // are not caught by the auth redirect before reaching the rewrite.
    // Also exclude any path with a file extension: public/ assets such as
    // webappbackground.png would otherwise be redirected to / for logged-out
    // visitors, so the browser receives HTML instead of the image.
    matcher: ['/((?!_next/|api/|.*\\.[^/]+$).*)'],
};
