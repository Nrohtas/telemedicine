import { NextResponse } from 'next/server';
import pool from '@/lib/db';

export async function GET() {
    try {
        // Query to get districts and count hospitals as a base
        // Using telemedicine database explicitly based on previous exploration
        const query = `
            SELECT 
                a.amp_code, 
                a.amp_name,
                COUNT(h.hospcode) as total_hospitals
            FROM telemedicine.ampur a
            LEFT JOIN telemedicine.hospital h ON a.amp_code = h.amp_code
            GROUP BY a.amp_code, a.amp_name
            ORDER BY a.amp_code ASC
        `;

        const [rows]: any = await pool.query(query);

        // Mocking Mohpromt Station and Sorn Buddy counts for each ampur 
        // since actual data columns aren't identified yet.
        // We use total_hospitals as a reference.
        const stats = rows.map((row: any) => ({
            amp_code: row.amp_code,
            amp_name: row.amp_name,
            mohpromt_count: Math.floor(row.total_hospitals * 0.8), // Mock 80% have it
            sornbuddy_count: Math.floor(row.total_hospitals * 0.6), // Mock 60% have it
        }));

        return NextResponse.json(stats);
    } catch (error: any) {
        console.error('Database error in ampur-stats:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
