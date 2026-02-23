import { NextResponse } from 'next/server';
import pool from '@/lib/db';

export async function GET() {
    try {
        const query = `
            SELECT file_time FROM (
                SELECT file_time FROM telemedicine.fileupload
                UNION
                SELECT d_update as file_time FROM telemedicine.telemedicine
            ) AS combined_updates
            ORDER BY file_time DESC
            LIMIT 1
        `;
        const [rows]: any = await pool.query(query);
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
