import { NextResponse } from 'next/server';
import pool from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET() {
    try {
        const query = `
            SELECT 
                (SELECT SUM(COALESCE(result, 0)) FROM telemedicine) as total_result,
                target as target, 
                target_2 as target_2, 
                target_4 as target_4, 
                target_8 as target_8, 
                target_10 as target_10
            FROM target
            LIMIT 1
        `;
        const [rows]: any = await pool.query(query);
        console.log('Target API rows:', rows);
        
        if (rows.length === 0) {
            return NextResponse.json({
                total_result: 0,
                target: 0,
                target_2: 0,
                target_4: 0,
                target_8: 0,
                target_10: 0
            });
        }

        const data = rows[0];
        return NextResponse.json({
            total_result: parseInt(data.total_result) || 0,
            target: parseInt(data.target) || 0,
            target_2: parseInt(data.target_2) || 0,
            target_4: parseInt(data.target_4) || 0,
            target_8: parseInt(data.target_8) || 0,
            target_10: parseInt(data.target_10) || 0
        });
    } catch (error: any) {
        console.error('Database error in target API:', error);
        return NextResponse.json({
            error: 'Database connection failed',
            details: error.message
        }, { status: 500 });
    }
}
