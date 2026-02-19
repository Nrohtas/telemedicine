import { NextResponse } from 'next/server';
import pool from '@/lib/db';

export async function GET(request: Request) {
    try {
        const { searchParams } = new URL(request.url);
        const affiliation = searchParams.get('affiliation');
        const amp_code = searchParams.get('amp_code');
        const hospcode = searchParams.get('hospcode');
        const type = searchParams.get('type');
        const year = searchParams.get('year') || '2569'; // Default to latest fiscal year

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
                COALESCE(t.buddycare, 0) as buddycare
            FROM hospital h
            LEFT JOIN telemedicine.hostype ht ON h.hostype_new = ht.hostype_new
            LEFT JOIN telemedicine.telemedicine t ON h.hospcode = t.hospcode AND t.b_year = ?
            WHERE h.status = '1' 
        `;
        const params: any[] = [year];

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
