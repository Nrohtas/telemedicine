import { NextResponse } from 'next/server';
import pool from '@/lib/db';

export async function GET() {
    try {
        // Fetch months and order by fiscal year (October to September)
        const [rows] = await pool.query(`
            SELECT month_no, month_name, month_th 
            FROM month 
            ORDER BY CASE WHEN month_no >= '10' THEN 1 ELSE 2 END, month_no
        `);
        return NextResponse.json(rows);
    } catch (error: any) {
        console.error('Database error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
