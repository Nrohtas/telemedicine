import { NextResponse } from 'next/server';
import pool from '@/lib/db';

export async function GET() {
    try {
        const query = `
            SELECT DISTINCT hostype 
            FROM telemedicine.hostype 
            WHERE hostype IS NOT NULL 
            ORDER BY 
                CASE 
                    WHEN hostype = 'รพ.สต.' THEN 1
                    WHEN hostype = 'ศูนย์สุขภาพ' THEN 2
                    WHEN hostype = 'รพช.' THEN 3
                    WHEN hostype = 'รพศ.' THEN 4
                    WHEN hostype LIKE '%รพ.จิต%' THEN 5
                    WHEN hostype = 'สถานพยาบาล' THEN 6
                    ELSE 99 
                END
        `;

        const [rows]: any = await pool.query(query);
        const types = rows.map((row: any) => row.hostype);

        return NextResponse.json(types);
    } catch (error: any) {
        console.error('Database error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
