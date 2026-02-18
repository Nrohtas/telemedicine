import { NextResponse } from 'next/server';
import pool from '@/lib/db';

export async function GET() {
    try {
        const query = `
            SELECT DISTINCT hostype_name 
            FROM telemedicine.hostype 
            WHERE hostype_name IS NOT NULL AND hostype_name != '' 
            ORDER BY 
                CASE 
                    WHEN hostype_name = 'กระทรวงสาธารณสุข' THEN 1
                    WHEN hostype_name = 'องค์กรปกครองส่วนท้องถิ่น' THEN 2
                    ELSE 3
                END, 
                hostype_name ASC
        `;
        const [rows]: any = await pool.query(query);

        const affiliations = rows.map((row: any) => row.hostype_name);

        return NextResponse.json(affiliations);
    } catch (error: any) {
        console.error('Database error in affiliations:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
