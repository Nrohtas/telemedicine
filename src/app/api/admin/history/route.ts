import { NextRequest, NextResponse } from 'next/server';
import pool from '@/lib/db';

export async function GET(request: NextRequest) {
    try {
        const query = 'SELECT * FROM fileupload ORDER BY file_time DESC LIMIT 20';
        const [rows]: any = await pool.query(query);

        const [lastHdc]: any = await pool.query('SELECT hdc_update FROM telemed_opd_hdc ORDER BY hdc_update DESC LIMIT 1');
        const lastHdcUpdate = lastHdc[0]?.hdc_update || null;

        return NextResponse.json({
            success: true,
            data: rows,
            lastHdcUpdate
        });
    } catch (error: any) {
        console.error('History fetch error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
