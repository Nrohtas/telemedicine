import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { verifyJWT } from '@/lib/auth';
import pool from '@/lib/db';

export async function GET() {
    try {
        const cookieStore = await cookies();
        const token = cookieStore.get('token')?.value;

        if (!token) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const payload = await verifyJWT(token);
        if (!payload) {
            return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
        }

        // Fetch latest data from DB to ensure status is up to date (for polling pending status)
        const [rows]: any = await pool.query(
            'SELECT id, username, name_th, hname, status FROM users WHERE id = ?', 
            [payload.id]
        );
        
        if (rows.length === 0) {
            return NextResponse.json({ error: 'User not found' }, { status: 404 });
        }

        const user = rows[0];

        return NextResponse.json({
            id: user.id,
            username: user.username,
            name: user.name_th,
            hname: user.hname,
            status: user.status
        });

    } catch (error) {
        console.error('Auth check error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
