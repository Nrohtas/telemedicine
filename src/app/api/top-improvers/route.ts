import { NextResponse } from 'next/server';
import pool from '@/lib/db';

export async function GET() {
    try {
        const getQuery = (types: number[]) => `
            SELECT 
                h.hospcode, 
                h.hospname, 
                h.amp_name,
                ht.hostype_label,
                ht.affiliation,
                COALESCE(t.result, 0) as current_total,
                COALESCE(t.result_past, 0) as past_total,
                (COALESCE(t.result, 0) - COALESCE(t.result_past, 0)) as increase,
                COALESCE(tg.op_30, 0) as target
            FROM hospital h
            LEFT JOIN (
                SELECT hostype_new, MAX(hostype) as hostype_label, MAX(hostype_name) as affiliation
                FROM hostype
                GROUP BY hostype_new
            ) ht ON h.hostype_new = ht.hostype_new
            JOIN telemed t ON h.hospcode = t.hospcode
            LEFT JOIN (
                SELECT hospcode, CEILING(COALESCE(op_30, 0)) as op_30
                FROM target
                WHERE b_year = '2568'
            ) tg ON h.hospcode = tg.hospcode
            WHERE h.status = '1' AND t.b_year = '2569'
            AND h.hostype_new IN (${types.join(',')})
            GROUP BY h.hospcode, ht.hostype_label, ht.affiliation, tg.op_30
            ORDER BY increase DESC, current_total DESC
            LIMIT 10
        `;

        const [hospitals] = await pool.query(getQuery([5, 7, 11, 12]));
        const [primaryCare] = await pool.query(getQuery([8, 13, 18, 21]));

        return NextResponse.json({
            hospitals,
            primaryCare
        });
    } catch (error: any) {
        console.error('Database error in top-improvers:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
