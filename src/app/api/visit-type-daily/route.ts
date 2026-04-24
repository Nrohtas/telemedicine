import { NextResponse } from 'next/server';
import pool from '@/lib/db';

export async function POST(request: Request) {
    try {
        const payload = await request.json();
        
        if (!payload || (Array.isArray(payload) && payload.length === 0)) {
            return NextResponse.json({
                code: 400,
                status: 'error',
                message: 'Payload is empty or invalid',
            }, { status: 400 });
        }

        const data = Array.isArray(payload) ? payload : [payload];

        // Validation
        for (const item of data) {
            if (!item.hoscode || !item.visit_date) {
                return NextResponse.json({
                    code: 400,
                    status: 'error',
                    message: 'hoscode and visit_date are required for each record',
                }, { status: 400 });
            }
        }

        const query = `
            REPLACE INTO visit_type_daily 
            (hoscode, visit_date, visit_type_2, visit_type_3, visit_type_5) 
            VALUES ?
        `;

        const values = data.map((item: any) => [
            item.hoscode,
            item.visit_date,
            item.visit_type_2 ?? 0,
            item.visit_type_3 ?? 0,
            item.visit_type_5 ?? 0
        ]);

        const [result]: any = await pool.query(query, [values]);

        return NextResponse.json({
            code: 200,
            status: 'success',
            message: 'Data processed successfully',
            data: {
                affectedRows: result.affectedRows,
                recordsProcessed: data.length
            }
        }, { status: 200 });

    } catch (error: any) {
        console.error('API Error [visit-type-daily]:', error);
        
        return NextResponse.json({
            code: 500,
            status: 'error',
            message: 'Internal Server Error',
            details: error.message
        }, { status: 500 });
    }
}
