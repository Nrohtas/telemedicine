import { NextResponse } from 'next/server';
import pool from '@/lib/db';

export async function GET() {
    try {
        const query = `
            SELECT DISTINCT hostype_list 
            FROM telemedicine.hostype 
            WHERE hostype_list IS NOT NULL 
            ORDER BY hostype_list ASC
        `;

        const [rows]: any = await pool.query(query);
        const types = rows.map((row: any) => row.hostype_list);

        return NextResponse.json(types);
    } catch (error: any) {
        console.error('Database error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
