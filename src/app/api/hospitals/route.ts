import { NextResponse } from 'next/server';
import pool from '@/lib/db';

export async function GET(request: Request) {
    try {
        const { searchParams } = new URL(request.url);
        const ampCode = searchParams.get('amp_code');

        let query = "SELECT hospcode, hospname FROM hospital WHERE status = '1' ORDER BY hospcode ASC";
        let params: string[] = [];

        if (ampCode && ampCode !== 'ทั้งหมด') {
            query = "SELECT hospcode, hospname FROM hospital WHERE amp_code = ? AND status = '1' ORDER BY hospcode ASC";
            params = [ampCode];
        }

        const [rows] = await pool.query(query, params);
        return NextResponse.json(rows);
    } catch (error: any) {
        console.error('Database error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
