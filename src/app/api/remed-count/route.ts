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
            REPLACE INTO remed_count
            (hoscode, visit_date, count_case_dx_rx_same_prev_vst)
            VALUES ?
        `;

        const values = data.map((item: any) => [
            item.hoscode,
            item.visit_date,
            item.count_case_dx_rx_same_prev_vst ?? 0
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
        console.error('API Error [remed-count]:', error);

        return NextResponse.json({
            code: 500,
            status: 'error',
            message: 'Internal Server Error',
            details: error.message
        }, { status: 500 });
    }
}
