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
                COALESCE(vtd.visit_type_5, 0) as his_tele,
                COALESCE(hdc.hdc_result, 0) as hdc_tele,
                COALESCE(hdc.hdc_result, 0) as current_total, -- for sorting
                COALESCE(hdc.hdc_opd, 0) as total_all,
                CASE 
                    WHEN COALESCE(hdc.hdc_opd, 0) > 0
                    THEN (COALESCE(hdc.hdc_result, 0) / COALESCE(hdc.hdc_opd, 0)) * 100
                    ELSE 0
                END as performance_percent,
                CASE 
                    WHEN (COALESCE(vtd.visit_type_2, 0) + COALESCE(vtd.visit_type_3, 0) + COALESCE(vtd.visit_type_5, 0)) > 0
                    THEN (COALESCE(vtd.visit_type_5, 0) / (COALESCE(vtd.visit_type_2, 0) + COALESCE(vtd.visit_type_3, 0) + COALESCE(vtd.visit_type_5, 0))) * 100
                    ELSE 0
                END as his_percent,
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
            LEFT JOIN (
                SELECT 
                    hospcode,
                    SUM(opd) as hdc_opd,
                    SUM(telemedicine) as hdc_result
                FROM telemed_opd_hdc
                WHERE b_year = '2569'
                GROUP BY hospcode
            ) hdc ON h.hospcode = hdc.hospcode
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
                COALESCE(SUM(hdc.hdc_result), 0) as hdc_result,
                COALESCE(SUM(hdc.hdc_opd), 0) as hdc_opd,
                COALESCE(SUM(vtd.visit_type_5), 0) as total_visit_5,
                COALESCE(SUM(COALESCE(vtd.visit_type_2, 0) + COALESCE(vtd.visit_type_3, 0) + COALESCE(vtd.visit_type_5, 0)), 0) as total_all
            FROM hospital h
            LEFT JOIN (
                SELECT 
                    hospcode,
                    SUM(opd) as hdc_opd,
                    SUM(telemedicine) as hdc_result
                FROM telemed_opd_hdc
                WHERE b_year = '2569'
                GROUP BY hospcode
            ) hdc ON h.hospcode = hdc.hospcode
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

        const hospSummary = hospSummaryRows[0] || { hdc_result: 0, hdc_opd: 0, total_visit_5: 0, total_all: 0 };
        const hdc_res = Number(hospSummary.hdc_result);
        const hdc_opd = Number(hospSummary.hdc_opd);
        const his_res = Number(hospSummary.total_visit_5);
        const his_opd = Number(hospSummary.total_all);

        const hdcSummaryPercent = hdc_opd > 0 ? (hdc_res / hdc_opd) * 100 : 0;
        const hisSummaryPercent = his_opd > 0 ? (his_res / his_opd) * 100 : 0;

        // Add summary for hostype 8, 18, 21 (Primary Care)
        const [pcSummaryRows]: any = await pool.query(`
            SELECT 
                COALESCE(SUM(hdc.hdc_result), 0) as hdc_result,
                COALESCE(SUM(hdc.hdc_opd), 0) as hdc_opd,
                COALESCE(SUM(vtd.visit_type_5), 0) as total_visit_5,
                COALESCE(SUM(COALESCE(vtd.visit_type_2, 0) + COALESCE(vtd.visit_type_3, 0) + COALESCE(vtd.visit_type_5, 0)), 0) as total_all
            FROM hospital h
            LEFT JOIN (
                SELECT 
                    hospcode,
                    SUM(opd) as hdc_opd,
                    SUM(telemedicine) as hdc_result
                FROM telemed_opd_hdc
                WHERE b_year = '2569'
                GROUP BY hospcode
            ) hdc ON h.hospcode = hdc.hospcode
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

        const pcSummary = pcSummaryRows[0] || { hdc_result: 0, hdc_opd: 0, total_visit_5: 0, total_all: 0 };
        const pc_hdc_res = Number(pcSummary.hdc_result);
        const pc_hdc_opd = Number(pcSummary.hdc_opd);
        const pc_his_res = Number(pcSummary.total_visit_5);
        const pc_his_opd = Number(pcSummary.total_all);

        const hdcPcSummaryPercent = pc_hdc_opd > 0 ? (pc_hdc_res / pc_hdc_opd) * 100 : 0;
        const hisPcSummaryPercent = pc_his_opd > 0 ? (pc_his_res / pc_his_opd) * 100 : 0;

        const [lastHdc]: any = await pool.query('SELECT hdc_update FROM telemed_opd_hdc ORDER BY hdc_update DESC LIMIT 1');
        const lastHdcUpdate = lastHdc[0]?.hdc_update || null;

        const [lastHis]: any = await pool.query('SELECT d_update FROM visit_type_daily ORDER BY d_update DESC LIMIT 1');
        const lastHisUpdate = lastHis[0]?.d_update || null;

        return NextResponse.json({
            hospitals,
            primaryCare,
            lastHdcUpdate,
            lastHisUpdate,
            hospSummary: {
                hdc_tele: hdc_res,
                hdc_opd: hdc_opd,
                his_tele: his_res,
                his_opd: his_opd,
                hdc_percent: hdcSummaryPercent,
                his_percent: hisSummaryPercent
            },
            pcSummary: {
                hdc_tele: pc_hdc_res,
                hdc_opd: pc_hdc_opd,
                his_tele: pc_his_res,
                his_opd: pc_his_opd,
                hdc_percent: hdcPcSummaryPercent,
                his_percent: hisPcSummaryPercent
            }
        });
    } catch (error: any) {
        console.error('Database error in top-performance:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
