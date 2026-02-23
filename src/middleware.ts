import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { verifyJWT } from '@/lib/auth';

export async function middleware(request: NextRequest) {
    const { pathname } = request.nextUrl;
    // console.log('Middleware pathname:', pathname);

    // Define public routes
    const isPublicApiRoute = pathname.startsWith('/telemedicine/api') && (
        pathname.startsWith('/telemedicine/api/login') ||
        pathname.startsWith('/telemedicine/api/register') ||
        pathname.startsWith('/telemedicine/api/auth') ||
        (request.method === 'GET' && (
            pathname.startsWith('/telemedicine/api/hospital-directory') ||
            pathname.startsWith('/telemedicine/api/affiliations') ||
            pathname.startsWith('/telemedicine/api/hospital-types') ||
            pathname.startsWith('/telemedicine/api/districts') ||
            pathname.startsWith('/telemedicine/api/hospitals') ||
            pathname.startsWith('/telemedicine/api/months') ||
            pathname.startsWith('/telemedicine/api/fiscal-years') ||
            pathname.startsWith('/telemedicine/api/ampur-stats') ||
            pathname.startsWith('/telemedicine/api/last-update')
        ))
    );

    // Protect /admin routes and private /api routes
    if (pathname.startsWith('/telemedicine/admin') || (pathname.startsWith('/telemedicine/api') && !isPublicApiRoute)) {
        // Check for token in cookie or Authorization header
        let token = request.cookies.get('token')?.value;

        if (!token) {
            const authHeader = request.headers.get('Authorization');
            if (authHeader?.startsWith('Bearer ')) {
                token = authHeader.split(' ')[1];
            }
        }

        if (!token) {
            if (pathname.startsWith('/telemedicine/api')) {
                return NextResponse.json({ error: 'Unauthorized: No token provided' }, { status: 401 });
            }
            return NextResponse.redirect(new URL('/telemedicine/login', request.url));
        }

        // Verify token
        const payload = await verifyJWT(token);

        if (!payload) {
            if (pathname.startsWith('/telemedicine/api')) {
                return NextResponse.json({ error: 'Unauthorized: Invalid token' }, { status: 401 });
            }
            const response = NextResponse.redirect(new URL('/telemedicine/login', request.url));
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
