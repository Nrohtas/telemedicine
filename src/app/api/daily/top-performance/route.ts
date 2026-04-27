import { NextResponse } from 'next/server';
import pool from '@/lib/db';

export async function GET() {
    try {
        const getQuery = (types: number[], extraWhere: string = '') => `
            SELECT 
                h.hospcode, 
                h.hospname, 
                h.amp_name,
                ht.hostype_label,
                ht.affiliation,
                COALESCE(vtd.visit_type_5, 0) as current_total,
                (COALESCE(vtd.visit_type_2, 0) + COALESCE(vtd.visit_type_3, 0) + COALESCE(vtd.visit_type_5, 0)) as total_all,
                CASE 
                    WHEN (COALESCE(vtd.visit_type_2, 0) + COALESCE(vtd.visit_type_3, 0) + COALESCE(vtd.visit_type_5, 0)) > 0
                    THEN (COALESCE(vtd.visit_type_5, 0) / (COALESCE(vtd.visit_type_2, 0) + COALESCE(vtd.visit_type_3, 0) + COALESCE(vtd.visit_type_5, 0))) * 100
                    ELSE 0
                END as performance_percent,
                COALESCE(tg.op_30, 0) as target
            FROM hospital h
            LEFT JOIN (
                SELECT hostype_new, MAX(hostype) as hostype_label, MAX(hostype_name) as affiliation
                FROM hostype
                GROUP BY hostype_new
            ) ht ON h.hostype_new = ht.hostype_new
            LEFT JOIN (
                SELECT 
                    hoscode, 
                    SUM(visit_type_2) as visit_type_2,
                    SUM(visit_type_3) as visit_type_3,
                    SUM(visit_type_5) as visit_type_5
                FROM visit_type_daily
                WHERE visit_date BETWEEN '2026-03-23' AND CURDATE()
                GROUP BY hoscode
            ) vtd ON h.hospcode = vtd.hoscode
            LEFT JOIN target tg ON h.hospcode = tg.hospcode AND tg.b_year = '2568'
            WHERE h.status = '1'
            AND h.hostype_new IN (${types.join(',')})
            ${extraWhere}
            ORDER BY current_total DESC, performance_percent DESC, h.hospcode ASC
            LIMIT 10
        `;

        const mophWhere = "AND h.dep_name = 'สำนักงานปลัดกระทรวงสาธารณสุข'";
        const [hospitals] = await pool.query(getQuery([5, 7, 11, 12], mophWhere));
        const [primaryCare] = await pool.query(getQuery([8, 13, 18, 21], mophWhere));

        return NextResponse.json({
            hospitals,
            primaryCare
        });
    } catch (error: any) {
        console.error('Database error in top-performance:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
