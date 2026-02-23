import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { verifyJWT } from '@/lib/auth';

export async function middleware(request: NextRequest) {
    const { pathname } = request.nextUrl;
    // console.log('Middleware pathname:', pathname);

    // Define public routes
    const isPublicApiRoute = pathname.startsWith('/api') && (
        pathname.startsWith('/api/login') ||
        pathname.startsWith('/api/register') ||
        pathname.startsWith('/api/auth') ||
        (request.method === 'GET' && (
            pathname.startsWith('/api/hospital-directory') ||
            pathname.startsWith('/api/affiliations') ||
            pathname.startsWith('/api/hospital-types') ||
            pathname.startsWith('/api/districts') ||
            pathname.startsWith('/api/hospitals') ||
            pathname.startsWith('/api/months') ||
            pathname.startsWith('/api/fiscal-years') ||
            pathname.startsWith('/api/ampur-stats') ||
            pathname.startsWith('/api/last-update') ||
            pathname.startsWith('/api/global-stats') ||
            pathname.startsWith('/api/updates')
        ))
    );

    // Protect /admin routes and private /api routes
    if (pathname.startsWith('/admin') || (pathname.startsWith('/api') && !isPublicApiRoute)) {
        // Check for token in cookie or Authorization header
        let token = request.cookies.get('token')?.value;

        if (!token) {
            const authHeader = request.headers.get('Authorization');
            if (authHeader?.startsWith('Bearer ')) {
                token = authHeader.split(' ')[1];
            }
        }

        if (!token) {
            if (pathname.startsWith('/api')) {
                return NextResponse.json({ error: 'Unauthorized: No token provided' }, { status: 401 });
            }
            const loginUrl = request.nextUrl.clone();
            loginUrl.pathname = '/login';
            return NextResponse.redirect(loginUrl);
        }

        // Verify token
        const payload = await verifyJWT(token);

        if (!payload) {
            if (pathname.startsWith('/api')) {
                return NextResponse.json({ error: 'Unauthorized: Invalid token' }, { status: 401 });
            }
            const loginUrl = request.nextUrl.clone();
            loginUrl.pathname = '/login';
            const response = NextResponse.redirect(loginUrl);
            response.cookies.delete('token');
            return response;
        }

        return NextResponse.next();
    }

    return NextResponse.next();
}

export const config = {
    matcher: ['/telemedicine/api/:path*', '/telemedicine/admin/:path*', '/api/:path*', '/admin/:path*'],
};
