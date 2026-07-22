import { NextResponse } from 'next/server';
import pool from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
    try {
        const { searchParams } = new URL(request.url);
        const type = searchParams.get('type');

        const year = searchParams.get('year') || '2569';
        let query = `
            SELECT 
                SUM(COALESCE(t.result, 0)) as total_services,
                SUM(COALESCE(t.result_past, 0)) as total_result_past,
                MAX(t.result_date) as last_update_date,
                MAX(t.result_past_date) as prev_update_date,
                SUM(COALESCE(t.moph, 0)) as total_moph,
                SUM(COALESCE(t.buddycare, 0)) as total_buddycare,
                SUM(COALESCE(t.hdc, 0)) as total_hdc,
                SUM(COALESCE(t.healthconnex, 0)) as total_healthconnex,
                (
                    SELECT COUNT(*) 
                    FROM hospital h2 
                    ${type ? 'INNER JOIN hostype ht2 ON h2.hostype = ht2.hostype_new' : ''}
                    WHERE h2.status = '1' ${type ? 'AND ht2.hostype_list = ?' : ''}
                ) as total_hospitals
            FROM telemed t
            INNER JOIN hospital h ON t.hospcode = h.hospcode
            ${type ? 'INNER JOIN hostype ht ON h.hostype = ht.hostype_new' : ''}
            WHERE h.status = '1' AND t.b_year = ?
        `;

        if (type) {
            query += ` AND ht.hostype_list = ?`;
        }
        
        const params = type ? [type, year, type] : [year];
        const [rows]: any = await pool.query(query, params);
        const data = rows[0];

        return NextResponse.json({
            total_services: parseInt(data.total_services) || 0,
            total_result_past: parseInt(data.total_result_past) || 0,
            last_update_date: data.last_update_date,
            prev_update_date: data.prev_update_date,
            total_moph: parseInt(data.total_moph) || 0,
            total_buddycare: parseInt(data.total_buddycare) || 0,
            total_hdc: parseInt(data.total_hdc) || 0,
            total_healthconnex: parseInt(data.total_healthconnex) || 0,
            total_hospitals: parseInt(data.total_hospitals) || 0,
        });
    } catch (error: any) {
        console.error('Database error in global-stats:', error);
        return NextResponse.json({
            error: 'Database connection failed',
            details: error.message
        }, { status: 500 });
    }
}
