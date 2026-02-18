import { NextResponse } from 'next/server';
import pool from '@/lib/db';
import { comparePassword, signJWT } from '@/lib/auth';

export async function POST(request: Request) {
    try {
        const { username, password } = await request.json();

        if (!username || !password) {
            return NextResponse.json({ error: 'Username and password are required' }, { status: 400 });
        }

        const query = 'SELECT * FROM users WHERE username = ?';
        const [rows]: any = await pool.query(query, [username]);

        if (rows.length === 0) {
            return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 });
        }

        const user = rows[0];
        const isPasswordValid = await comparePassword(password, user.password);

        if (!isPasswordValid) {
            return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 });
        }

        // Generate JWT
        const token = await signJWT({ id: user.id, username: user.username });

        const response = NextResponse.json({ success: true, message: 'Logged in successfully' });

        // Set cookie
        response.cookies.set('token', token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'strict',
            maxAge: 60 * 60 * 24, // 1 day
            path: '/',
        });

        return response;

    } catch (error: any) {
        console.error('Login error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
