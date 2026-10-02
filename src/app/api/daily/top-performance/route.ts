import { NextRequest, NextResponse } from 'next/server';
import pool from '@/lib/db';
import { getTargetYear } from '@/lib/targetYear';

export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const rawPolicy = searchParams.get('policy') === 'pheoc' ? 'pheoc' : 'normal';
        const year = searchParams.get('year') || '2569';
        const policy = year === '2570' ? 'normal' : rawPolicy;
        const targetYear = await getTargetYear(year);
        const hdcTable = (year === '2570' || policy !== 'pheoc') ? 'telemed_opd_hdc' : 'telemed_opd_hdc_pheoc';
        const hisStartDate = year === '2569'
            ? (policy === 'pheoc' ? '2026-03-23' : '2026-01-01')
            : '2026-10-01';
        const hisEndDateCondition = year === '2569'
            ? "AND visit_date <= '2026-09-30'"
            : "AND visit_date <= '2027-09-30'";

        const getQuery = (types: number[], orderBy: string = 'current_total DESC, performance_percent DESC') => `
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
                CEILING(COALESCE(tg.op, 0)) as target
            FROM hospital h
            LEFT JOIN (
                SELECT hostype_new, MAX(hostype) as hostype_label, MAX(hostype_name) as affiliation
                FROM hostype
                GROUP BY hostype_new
            ) ht ON h.hostype_new = ht.hostype_new COLLATE utf8mb4_general_ci
            LEFT JOIN (
                SELECT 
                    hoscode, 
                    SUM(visit_type_2) as visit_type_2,
                    SUM(visit_type_3) as visit_type_3,
                    SUM(visit_type_5) as visit_type_5
                FROM visit_type_daily
                WHERE visit_date >= '${hisStartDate}' ${hisEndDateCondition}
                GROUP BY hoscode
            ) vtd ON h.hospcode = vtd.hoscode COLLATE utf8mb4_general_ci
            LEFT JOIN (
                SELECT 
                    hospcode,
                    SUM(opd) as hdc_opd,
                    SUM(telemedicine) as hdc_result
                FROM ${hdcTable}
                WHERE b_year = '${year}'
                GROUP BY hospcode
            ) hdc ON h.hospcode = hdc.hospcode COLLATE utf8mb4_general_ci
            LEFT JOIN target tg ON h.hospcode = tg.hospcode COLLATE utf8mb4_general_ci AND tg.b_year = '${targetYear}'
            WHERE h.status = '1'
            AND h.hostype_new IN (${types.join(',')})
            AND h.dep_name = 'สำนักงานปลัดกระทรวงสาธารณสุข' COLLATE utf8mb4_general_ci
            ORDER BY ${orderBy}, h.hospcode ASC
            LIMIT 10
        `;

        const [hospitals] = await pool.query(getQuery([5, 7, 11, 12], 'performance_percent DESC, current_total DESC'));
        const [primaryCare] = await pool.query(getQuery([8, 13, 18, 21], 'current_total DESC, performance_percent DESC'));

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
                FROM ${hdcTable}
                WHERE b_year = '${year}'
                GROUP BY hospcode
            ) hdc ON h.hospcode = hdc.hospcode COLLATE utf8mb4_general_ci
            LEFT JOIN (
                SELECT 
                    hoscode, 
                    SUM(visit_type_2) as visit_type_2,
                    SUM(visit_type_3) as visit_type_3,
                    SUM(visit_type_5) as visit_type_5
                FROM visit_type_daily
                WHERE visit_date >= '${hisStartDate}' ${hisEndDateCondition}
                GROUP BY hoscode
            ) vtd ON h.hospcode = vtd.hoscode COLLATE utf8mb4_general_ci
            WHERE h.status = '1'
            AND h.hostype_new IN (5, 7)
            AND h.dep_name = 'สำนักงานปลัดกระทรวงสาธารณสุข' COLLATE utf8mb4_general_ci
        `);

        const hospSummary = hospSummaryRows[0] || { hdc_result: 0, hdc_opd: 0, total_visit_5: 0, total_all: 0 };
        const hdc_res = Number(hospSummary.hdc_result || 0);
        const hdc_opd = Number(hospSummary.hdc_opd || 0);
        const his_res = Number(hospSummary.total_visit_5 || 0);
        const his_opd = Number(hospSummary.total_all || 0);

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
                FROM ${hdcTable}
                WHERE b_year = '${year}'
                GROUP BY hospcode
            ) hdc ON h.hospcode = hdc.hospcode COLLATE utf8mb4_general_ci
            LEFT JOIN (
                SELECT 
                    hoscode, 
                    SUM(visit_type_2) as visit_type_2,
                    SUM(visit_type_3) as visit_type_3,
                    SUM(visit_type_5) as visit_type_5
                FROM visit_type_daily
                WHERE visit_date >= '${hisStartDate}' ${hisEndDateCondition}
                GROUP BY hoscode
            ) vtd ON h.hospcode = vtd.hoscode COLLATE utf8mb4_general_ci
            WHERE h.status = '1'
            AND h.hostype_new IN (8, 18, 21)
            AND h.dep_name = 'สำนักงานปลัดกระทรวงสาธารณสุข' COLLATE utf8mb4_general_ci
        `);

        const pcSummary = pcSummaryRows[0] || { hdc_result: 0, hdc_opd: 0, total_visit_5: 0, total_all: 0 };
        const pc_hdc_res = Number(pcSummary.hdc_result || 0);
        const pc_hdc_opd = Number(pcSummary.hdc_opd || 0);
        const pc_his_res = Number(pcSummary.total_visit_5 || 0);
        const pc_his_opd = Number(pcSummary.total_all || 0);

        const hdcPcSummaryPercent = pc_hdc_opd > 0 ? (pc_hdc_res / pc_hdc_opd) * 100 : 0;
        const hisPcSummaryPercent = pc_his_opd > 0 ? (pc_his_res / pc_his_opd) * 100 : 0;

        const mapToNumber = (rows: any[]) => rows.map(r => ({
            ...r,
            his_tele: Number(r.his_tele) || 0,
            hdc_tele: Number(r.hdc_tele) || 0,
            current_total: Number(r.current_total) || 0,
            total_all: Number(r.total_all) || 0,
            performance_percent: Number(r.performance_percent) || 0,
            his_percent: Number(r.his_percent) || 0,
            target: Number(r.target) || 0,
        }));

        const [lastHdc]: any = await pool.query(`SELECT DATE_FORMAT(MAX(hdc_update), '%Y-%m-%d') as hdc_update FROM ${hdcTable}`);
        const [lastHis]: any = await pool.query("SELECT DATE_FORMAT(MAX(d_update), '%Y-%m-%d %H:%i:%s') as d_update FROM visit_type_daily");

        const lastHdcUpdate = lastHdc[0]?.hdc_update || null;
        const lastHisUpdate = lastHis[0]?.d_update || null;

        return NextResponse.json({
            hospitals: mapToNumber(hospitals as any[]),
            primaryCare: mapToNumber(primaryCare as any[]),
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
