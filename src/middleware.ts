import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { verifyJWT } from '@/lib/auth';

export async function middleware(request: NextRequest) {
    const { pathname } = request.nextUrl;

    const checkPath = pathname.startsWith('/telemedicine') ? pathname.slice(13) : pathname;

    const isPublicApiRoute = checkPath.startsWith('/api') && (
        checkPath.startsWith('/api/login') ||
        checkPath.startsWith('/api/register') ||
        checkPath.startsWith('/api/auth') ||
        checkPath.startsWith('/api/visit-type-daily') ||
        (request.method === 'GET' && (
            checkPath.startsWith('/api/hospital-directory') ||
            checkPath.startsWith('/api/affiliations') ||
            checkPath.startsWith('/api/hospital-types') ||
            checkPath.startsWith('/api/districts') ||
            checkPath.startsWith('/api/hospitals') ||
            checkPath.startsWith('/api/months') ||
            checkPath.startsWith('/api/fiscal-years') ||
            checkPath.startsWith('/api/ampur-stats') ||
            checkPath.startsWith('/api/last-update') ||
            checkPath.startsWith('/api/global-stats') ||
            checkPath.startsWith('/api/top-improvers') ||
            checkPath.startsWith('/api/daily/top-performance') ||
            checkPath.startsWith('/api/updates') ||
            checkPath.startsWith('/api/target')
        ))
    );

    const isProtected = pathname.startsWith('/admin') || 
                        pathname.startsWith('/telemedicine/admin') || 
                        (pathname.includes('/api') && !isPublicApiRoute);

    if (isProtected) {
        let token = request.cookies.get('token')?.value;

        if (!token) {
            const authHeader = request.headers.get('Authorization');
            if (authHeader?.startsWith('Bearer ')) {
                token = authHeader.split(' ')[1];
            }
        }

        if (!token) {
            if (pathname.includes('/api')) {
                return NextResponse.json({ error: 'Unauthorized: No token provided' }, { status: 401 });
            }
            const loginUrl = request.nextUrl.clone();
            loginUrl.pathname = '/login';
            return NextResponse.redirect(loginUrl);
        }

        const payload = await verifyJWT(token);

        if (!payload) {
            if (pathname.includes('/api')) {
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
