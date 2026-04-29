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

        // Add summary for hostype 5 and 7 (Hospitals)
        const [hospSummaryRows]: any = await pool.query(`
            SELECT 
                COALESCE(SUM(vtd.visit_type_5), 0) as total_visit_5,
                COALESCE(SUM(vtd.visit_type_2 + vtd.visit_type_3 + vtd.visit_type_5), 0) as total_all
            FROM hospital h
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
            WHERE h.status = '1'
            AND h.hostype_new IN (5, 7)
            AND h.dep_name = 'สำนักงานปลัดกระทรวงสาธารณสุข'
        `);

        const hospSummary = hospSummaryRows[0] || { total_visit_5: 0, total_all: 0 };
        const hospSummaryPercent = hospSummary.total_all > 0 ? (hospSummary.total_visit_5 / hospSummary.total_all) * 100 : 0;

        // Add summary for hostype 8, 18, 21 (Primary Care)
        const [pcSummaryRows]: any = await pool.query(`
            SELECT 
                COALESCE(SUM(vtd.visit_type_5), 0) as total_visit_5,
                COALESCE(SUM(vtd.visit_type_2 + vtd.visit_type_3 + vtd.visit_type_5), 0) as total_all
            FROM hospital h
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
            WHERE h.status = '1'
            AND h.hostype_new IN (8, 18, 21)
            AND h.dep_name = 'สำนักงานปลัดกระทรวงสาธารณสุข'
        `);

        const pcSummary = pcSummaryRows[0] || { total_visit_5: 0, total_all: 0 };
        const pcSummaryPercent = pcSummary.total_all > 0 ? (pcSummary.total_visit_5 / pcSummary.total_all) * 100 : 0;

        return NextResponse.json({
            hospitals,
            primaryCare,
            hospSummary: {
                ...hospSummary,
                percent: hospSummaryPercent
            },
            pcSummary: {
                ...pcSummary,
                percent: pcSummaryPercent
            }
        });
    } catch (error: any) {
        console.error('Database error in top-performance:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
