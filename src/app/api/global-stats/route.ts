import { NextResponse } from 'next/server';
import pool from '@/lib/db';

export async function GET() {
    try {
        const query = `
            SELECT 
                SUM(COALESCE(t.result, 0)) as total_services,
                SUM(COALESCE(t.moph, 0)) as total_moph,
                SUM(COALESCE(t.buddycare, 0)) as total_buddycare,
                (SELECT COUNT(*) FROM telemedicine.hospital WHERE status = '1') as total_hospitals
            FROM telemedicine.telemedicine t
            INNER JOIN telemedicine.hospital h ON t.hospcode = h.hospcode
            WHERE h.status = '1'
        `;

        const [rows]: any = await pool.query(query);
        const data = rows[0];

        return NextResponse.json({
            total_services: parseInt(data.total_services) || 0,
            total_moph: parseInt(data.total_moph) || 0,
            total_buddycare: parseInt(data.total_buddycare) || 0,
            total_hospitals: parseInt(data.total_hospitals) || 0,
        });
    } catch (error: any) {
        console.error('Database error in global-stats:', error);
        return NextResponse.json({
            error: 'Database connection failed',
            details: error.message
        }, { status: 500 });
    }
}
