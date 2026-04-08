import { NextResponse } from 'next/server';
import pool from '@/lib/db';

export async function GET() {
    try {
        const query = `
            SELECT 
                h.hospcode, 
                h.hospname, 
                h.amp_name,
                ht.hostype_label,
                ht.affiliation,
                (COALESCE(t.moph, 0) + COALESCE(t.buddycare, 0)) as current_total,
                (COALESCE(t.moph_past, 0) + COALESCE(t.buddycare_past, 0)) as past_total,
                ((COALESCE(t.moph, 0) + COALESCE(t.buddycare, 0)) - (COALESCE(t.moph_past, 0) + COALESCE(t.buddycare_past, 0))) as increase
            FROM hospital h
            LEFT JOIN (
                SELECT hostype_new, MAX(hostype) as hostype_label, MAX(hostype_name) as affiliation
                FROM hostype
                GROUP BY hostype_new
            ) ht ON h.hostype_new = ht.hostype_new
            JOIN telemed t ON h.hospcode = t.hospcode
            WHERE h.status = '1' AND t.b_year = '2569'
            GROUP BY h.hospcode, ht.hostype_label, ht.affiliation
            HAVING increase > 0
            ORDER BY increase DESC
            LIMIT 10
        `;

        const [rows] = await pool.query(query);
        return NextResponse.json(rows);
    } catch (error: any) {
        console.error('Database error in top-improvers:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
