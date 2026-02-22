import { NextResponse } from 'next/server';
import pool from '@/lib/db';

export async function GET() {
    try {
        const [rows]: any = await pool.query('SELECT file_time FROM telemedicine.fileupload ORDER BY file_time DESC LIMIT 1');
        return NextResponse.json({
            lastUpdate: rows[0]?.file_time || null
        });
    } catch (error: any) {
        console.error('Database error in last-update:', error);
        return NextResponse.json({
            error: 'Database connection failed',
            details: error.message
        }, { status: 500 });
    }
}
