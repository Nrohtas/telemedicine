import { NextRequest, NextResponse } from 'next/server';
import pool from '@/lib/db';

export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const page = parseInt(searchParams.get('page') || '1');
        const limit = 10;
        const offset = (page - 1) * limit;

        // 1. Get total count
        const [countResult]: any = await pool.query('SELECT COUNT(*) as total FROM 43fileupload');
        const total = countResult[0].total;

        // 2. Get paginated data
        const query = `
            SELECT file_id, file_name, file_type, file_size, file_time, username, file_log
            FROM 43fileupload
            ORDER BY file_time DESC
            LIMIT ? OFFSET ?
        `;
        const [rows]: any = await pool.query(query, [limit, offset]);
        
        return NextResponse.json({
            data: rows,
            total,
            page,
            limit
        });
    } catch (error: any) {
        console.error('Fetch history error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
