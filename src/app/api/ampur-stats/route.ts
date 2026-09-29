import { NextResponse } from 'next/server';
import pool from '@/lib/db';

export async function GET(request: Request) {
    try {
        const { searchParams } = new URL(request.url);
        const type = searchParams.get('type');
        const year = searchParams.get('year') || '2569';

        // Query to get districts and count hospitals as a base
        // Using telemedicine database explicitly based on previous exploration
        let query = `
            SELECT 
                a.amp_code, 
                a.amp_name,
                SUM(COALESCE(t.moph, 0)) as mohpromt_count,
                SUM(COALESCE(t.buddycare, 0)) as sornbuddy_count,
                SUM(COALESCE(t.hdc, 0)) as hdc_count,
                SUM(COALESCE(t.healthconnex, 0)) as healthconnex_count,
                SUM(COALESCE(t.result, 0)) as total_result,
                SUM(COALESCE(t.result_past, 0)) as total_result_past,
                (
                    SELECT SUM(COALESCE(tg.op, 0)) FROM target tg 
                    INNER JOIN hospital h2 ON tg.hospcode = h2.hospcode 
                    ${type ? 'INNER JOIN hostype ht2 ON h2.hostype = ht2.hostype_new' : ''}
                    WHERE h2.amp_code = a.amp_code AND tg.b_year = ? AND h2.status = '1'
                    ${type ? 'AND ht2.hostype_list = ?' : ''}
                ) as target,
                (
                    SELECT SUM(COALESCE(tg.op_30, 0)) FROM target tg 
                    INNER JOIN hospital h2 ON tg.hospcode = h2.hospcode 
                    ${type ? 'INNER JOIN hostype ht2 ON h2.hostype = ht2.hostype_new' : ''}
                    WHERE h2.amp_code = a.amp_code AND tg.b_year = ? AND h2.status = '1'
                    ${type ? 'AND ht2.hostype_list = ?' : ''}
                ) as target_30
            FROM ampur a
            LEFT JOIN hospital h ON a.amp_code = h.amp_code AND h.status = '1'
            ${type ? 'LEFT JOIN hostype ht ON h.hostype = ht.hostype_new' : ''}
            LEFT JOIN telemed t ON h.hospcode = t.hospcode AND t.b_year = ?
            ${type ? 'WHERE ht.hostype_list = ?' : ''}
            GROUP BY a.amp_code, a.amp_name
            ORDER BY a.amp_code ASC
        `;

        const params: any[] = [];
        if (type) {
            params.push(year, type, year, type, year, type);
        } else {
            params.push(year, year, year);
        }
        const [rows]: any = await pool.query(query, params);

        const stats = rows.map((row: any) => ({
            amp_code: row.amp_code,
            amp_name: row.amp_name,
            mohpromt_count: parseInt(row.mohpromt_count) || 0,
            sornbuddy_count: parseInt(row.sornbuddy_count) || 0,
            hdc_count: parseInt(row.hdc_count) || 0,
            healthconnex_count: parseInt(row.healthconnex_count) || 0,
            total_result: parseInt(row.total_result) || 0,
            total_result_past: parseInt(row.total_result_past) || 0,
            target: parseFloat(row.target) || 0,
            target_30: parseFloat(row.target_30) || 0,
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
