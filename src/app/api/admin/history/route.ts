import { NextRequest, NextResponse } from 'next/server';
import pool from '@/lib/db';

export async function GET(request: NextRequest) {
    try {
        const query = 'SELECT * FROM fileupload ORDER BY file_time DESC LIMIT 20';
        const [rows]: any = await pool.query(query);

        return NextResponse.json({
            success: true,
            data: rows
        });
    } catch (error: any) {
        console.error('History fetch error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
