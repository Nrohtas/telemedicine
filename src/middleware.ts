import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { verifyJWT } from '@/lib/auth';

export async function middleware(request: NextRequest) {
    const { pathname } = request.nextUrl;

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
            pathname.startsWith('/api/last-update')
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
            return NextResponse.redirect(new URL('/login', request.url));
        }

        // Verify token
        const payload = await verifyJWT(token);

        if (!payload) {
            if (pathname.startsWith('/api')) {
                return NextResponse.json({ error: 'Unauthorized: Invalid token' }, { status: 401 });
            }
            const response = NextResponse.redirect(new URL('/login', request.url));
            response.cookies.delete('token');
            return response;
        }

        return NextResponse.next();
    }

    return NextResponse.next();
}

export const config = {
    matcher: ['/api/:path*', '/admin/:path*'],
};
