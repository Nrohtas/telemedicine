import { NextResponse } from 'next/server';
import pool from '@/lib/db';

export async function GET(request: Request) {
    try {
        const { searchParams } = new URL(request.url);
        const type = searchParams.get('type');

        // Query to get districts and count hospitals as a base
        // Using telemedicine database explicitly based on previous exploration
        let query = `
            SELECT 
                a.amp_code, 
                a.amp_name,
                SUM(COALESCE(t.moph, 0)) as mohpromt_count,
                SUM(COALESCE(t.buddycare, 0)) as sornbuddy_count,
                SUM(COALESCE(t.result, 0)) as total_result
            FROM ampur a
            LEFT JOIN hospital h ON a.amp_code = h.amp_code AND h.status = '1'
            ${type ? 'LEFT JOIN hostype ht ON h.hostype = ht.hostype_new' : ''}
            LEFT JOIN telemed t ON h.hospcode = t.hospcode
            ${type ? 'WHERE ht.hostype_list = ?' : ''}
            GROUP BY a.amp_code, a.amp_name
            ORDER BY a.amp_code ASC
        `;

        const params = type ? [type] : [];
        const [rows]: any = await pool.query(query, params);

        const stats = rows.map((row: any) => ({
            amp_code: row.amp_code,
            amp_name: row.amp_name,
            mohpromt_count: parseInt(row.mohpromt_count) || 0,
            sornbuddy_count: parseInt(row.sornbuddy_count) || 0,
            total_result: parseInt(row.total_result) || 0,
        }));

        return NextResponse.json(stats);
    } catch (error: any) {
        console.error('Database error in ampur-stats:', error);
        return NextResponse.json({
            error: 'Database connection failed',
            details: error.message,
            rows: []
        }, { status: 500 });
    }
}
