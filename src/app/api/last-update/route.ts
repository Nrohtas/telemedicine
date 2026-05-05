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
            query = `SELECT MAX(result_date) as file_time FROM telemed`;
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
