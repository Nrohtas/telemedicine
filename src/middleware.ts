import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { verifyJWT } from '@/lib/auth';

export async function middleware(request: NextRequest) {
    const { pathname } = request.nextUrl;

    // Only protect /api routes
    if (pathname.startsWith('/api')) {
        // Exclude public routes
        if (
            pathname.startsWith('/api/login') ||
            pathname.startsWith('/api/register') ||
            pathname.startsWith('/api/auth') ||
            // Allow public read-only access to dashboard data
            (request.method === 'GET' && (
                pathname.startsWith('/api/hospital-directory') ||
                pathname.startsWith('/api/affiliations') ||
                pathname.startsWith('/api/hospital-types') ||
                pathname.startsWith('/api/districts') ||
                pathname.startsWith('/api/hospitals') ||
                pathname.startsWith('/api/months') ||
                pathname.startsWith('/api/fiscal-years') ||
                pathname.startsWith('/api/ampur-stats')
            ))
        ) {
            return NextResponse.next();
        }

        // Check for token in cookie or Authorization header
        let token = request.cookies.get('token')?.value;

        if (!token) {
            const authHeader = request.headers.get('Authorization');
            if (authHeader?.startsWith('Bearer ')) {
                token = authHeader.split(' ')[1];
            }
        }

        if (!token) {
            return NextResponse.json({ error: 'Unauthorized: No token provided' }, { status: 401 });
        }

        // Verify token
        const payload = await verifyJWT(token);

        if (!payload) {
            return NextResponse.json({ error: 'Unauthorized: Invalid token' }, { status: 401 });
        }

        // Allow request to proceed
        return NextResponse.next();
    }

    // Allow all other requests (non-API)
    return NextResponse.next();
}

export const config = {
    matcher: ['/api/:path*'],
};
