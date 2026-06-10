import { NextResponse } from 'next/server';
import pool from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
    try {
        const { searchParams } = new URL(request.url);
        const type = searchParams.get('type');

        const year = searchParams.get('year') || '2569';
        const targetYear = (parseInt(year) - 1).toString();

        const query = `
            SELECT 
                (
                    SELECT SUM(COALESCE(t.result, 0)) FROM telemed t
                    INNER JOIN hospital h ON t.hospcode = h.hospcode
                    ${type ? 'INNER JOIN hostype ht ON h.hostype = ht.hostype_new' : ''}
                    WHERE t.b_year = ? AND h.status = '1'
                    ${type ? 'AND ht.hostype_list = ?' : ''}
                ) as total_result,
                SUM(CEILING(COALESCE(tg.op_30, 0))) as target_30,
                SUM(tg.op) as target
            FROM target tg
            INNER JOIN hospital h ON tg.hospcode = h.hospcode
            ${type ? 'INNER JOIN hostype ht ON h.hostype = ht.hostype_new' : ''}
            WHERE tg.b_year = ? AND h.status = '1'
            ${type ? 'AND ht.hostype_list = ?' : ''}
        `;
        const params = type ? [year, type, targetYear, type] : [year, targetYear];
        const [rows]: any = await pool.query(query, params);
        console.log('Target API rows:', rows);
        
        if (rows.length === 0 || !rows[0].target) {
            return NextResponse.json({
                total_result: 0,
                target: 0,
                target_30: 0,
                target_2: 0,
                target_4: 0,
                target_8: 0,
                target_10: 0
            });
        }

        const data = rows[0];
        const total_result = parseInt(data.total_result) || 0;
        const target = parseFloat(data.target) || 0;
        const target_30 = parseFloat(data.target_30) || 0;

        return NextResponse.json({
            total_result,
            target,
            target_30,
            target_2: target * 0.02,
            target_4: target * 0.04,
            target_8: target * 0.08,
            target_10: target * 0.10
        });
    } catch (error: any) {
        console.error('Database error in target API:', error);
        return NextResponse.json({
            error: 'Database connection failed',
            details: error.message
        }, { status: 500 });
    }
}
