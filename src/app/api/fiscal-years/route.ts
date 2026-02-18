import { NextResponse } from 'next/server';
import pool from '@/lib/db';

export async function GET() {
    try {
        // Fetch b_year from the year table in the telemedicine database
        const [rows] = await pool.query('SELECT b_year FROM year ORDER BY b_year DESC');
        return NextResponse.json(rows);
    } catch (error: any) {
        console.error('Database error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
