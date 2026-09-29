import { NextResponse } from 'next/server';
import pool from '@/lib/db';

export async function GET(request: Request) {
    try {
        const { searchParams } = new URL(request.url);
        const affiliation = searchParams.get('affiliation');
        const amp_code = searchParams.get('amp_code');
        const hospcode = searchParams.get('hospcode');
        const type = searchParams.get('type');
        const year = searchParams.get('year') || '2569'; // Default to fiscal year 2569

        let query = `
            SELECT 
                h.hospcode, 
                h.hospname, 
                h.hostype, 
                h.amp_code, 
                h.amp_name, 
                h.tmb_name,
                ht.hostype_name,
                ht.hostype as hostype_level,
                COALESCE(t.moph, 0) as moph,
                COALESCE(t.buddycare, 0) as buddycare,
                COALESCE(t.hdc, 0) as hdc,
                COALESCE(t.healthconnex, 0) as healthconnex,
                (COALESCE(t.moph, 0) + COALESCE(t.buddycare, 0) + COALESCE(t.hdc, 0) + COALESCE(t.healthconnex, 0)) as result,
                COALESCE(t.moph_past, 0) as moph_past,
                COALESCE(t.buddycare_past, 0) as buddycare_past,
                COALESCE(t.hdc_past, 0) as hdc_past,
                COALESCE(t.healthconnex_past, 0) as healthconnex_past,
                (COALESCE(t.moph_past, 0) + COALESCE(t.buddycare_past, 0) + COALESCE(t.hdc_past, 0) + COALESCE(t.healthconnex_past, 0)) as result_past,
                t.moph_date,
                t.moph_past_date,
                t.buddycare_date,
                t.buddycare_past_date,
                t.hdc_date,
                t.hdc_past_date,
                t.healthconnex_date,
                t.healthconnex_past_date,
                t.result_date,
                t.result_past_date,
                CEILING(COALESCE(tg.op, 0)) as op,
                CEILING(COALESCE(tg.op_30, 0)) as op_30
            FROM hospital h
            LEFT JOIN (
                SELECT hostype_new, hostype_name, hostype_list, MAX(CASE WHEN hostype = 'รพช.' THEN 'รพ.' ELSE hostype END) as hostype
                FROM hostype
                GROUP BY hostype_new, hostype_name, hostype_list
            ) ht ON h.hostype_new = ht.hostype_new
            LEFT JOIN telemed t ON h.hospcode = t.hospcode AND t.b_year = ?
            LEFT JOIN telemed_opd_hdc hdc_t ON h.hospcode = hdc_t.hospcode COLLATE utf8mb4_general_ci AND hdc_t.b_year = ?
            LEFT JOIN target tg ON h.hospcode = tg.hospcode AND tg.b_year = ?
            WHERE h.status = '1' 
        `;
        const targetYear = (parseInt(year) - 1).toString();
        const params: any[] = [year, year, targetYear];

        if (affiliation && affiliation !== 'ทั้งหมด') {
            query += " AND ht.hostype_name = ?";
            params.push(affiliation);
        }

        if (type && type !== 'ทั้งหมด') {
            query += " AND ht.hostype_list = ?";
            params.push(type);
        }

        if (amp_code && amp_code !== 'ทั้งหมด') {
            query += " AND h.amp_code = ?";
            params.push(amp_code);
        }

        if (hospcode && hospcode !== 'ทั้งหมด') {
            query += " AND h.hospcode = ?";
            params.push(hospcode);
        }

        query += " ORDER BY h.amp_code ASC, h.hospcode ASC";

        const [rows]: any = await pool.query(query, params);

        // Group by district (amp_name)
        const groupedData = rows.reduce((acc: any, curr: any) => {
            const district = curr.amp_name || 'ไม่ระบุ';
            if (!acc[district]) {
                acc[district] = {
                    amp_name: district,
                    amp_code: curr.amp_code,
                    hospitals: []
                };
            }
            acc[district].hospitals.push(curr);
            return acc;
        }, {});

        // Convert object back to array for easier frontend mapping
        const result = Object.values(groupedData);

        return NextResponse.json(result);
    } catch (error: any) {
        console.error('Database error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
