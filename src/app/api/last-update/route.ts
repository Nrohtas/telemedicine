import { NextResponse } from 'next/server';
import pool from '@/lib/db';

export async function GET(request: Request) {
    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type');

    try {
        let query = '';
        if (type === 'daily') {
            query = `SELECT d_update as file_time FROM visit_type_daily ORDER BY d_update DESC LIMIT 1`;
        } else {
            query = `
                SELECT file_time FROM (
                    SELECT file_time FROM fileupload
                    UNION
                    SELECT d_update as file_time FROM telemed
                    UNION
                    SELECT d_update as file_time FROM visit_type_daily
                ) AS combined_updates
                ORDER BY file_time DESC
                LIMIT 1
            `;
        }
        
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
