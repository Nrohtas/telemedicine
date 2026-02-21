import { NextResponse } from 'next/server';
import pool from '@/lib/db';

export async function GET() {
    try {
        const query = `
            SELECT 
                SUM(COALESCE(result, 0)) as total_services,
                SUM(COALESCE(moph, 0)) as total_moph,
                SUM(COALESCE(buddycare, 0)) as total_buddycare
            FROM telemedicine.telemedicine
        `;

        const [rows]: any = await pool.query(query);
        const data = rows[0];

        return NextResponse.json({
            total_services: parseInt(data.total_services) || 0,
            total_moph: parseInt(data.total_moph) || 0,
            total_buddycare: parseInt(data.total_buddycare) || 0,
            // Patients can be estimated as total services * a factor or we can count unique IDs if possible
            total_patients: Math.floor((parseInt(data.total_services) || 0) * 0.8),
        });
    } catch (error: any) {
        console.error('Database error in global-stats:', error);
        return NextResponse.json({
            error: 'Database connection failed',
            details: error.message
        }, { status: 500 });
    }
}
