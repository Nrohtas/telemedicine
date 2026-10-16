import { NextResponse } from 'next/server';
import pool from '@/lib/db';

export async function GET(request: Request) {
    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type');

    try {
        if (type === 'daily') {
            const query = `SELECT d_update as file_time FROM visit_type_daily ORDER BY d_update DESC LIMIT 1`;
            const [rows]: any = await pool.query(query);
            return NextResponse.json({
                lastUpdate: rows[0]?.file_time || null
            });
        }

        const year = searchParams.get('year');

        // วันที่ของ "กองสนับสนุนระบบสุขภาพปฐมภูมิ" (Platform: หมอพร้อม, Buddy Care, Health Connex)
        const platformQuery = year
            ? `SELECT GREATEST(
                COALESCE(MAX(moph_date), '1970-01-01'),
                COALESCE(MAX(buddycare_date), '1970-01-01'),
                COALESCE(MAX(healthconnex_date), '1970-01-01')
               ) as file_time FROM telemed WHERE b_year = ?`
            : `SELECT GREATEST(
                COALESCE(MAX(moph_date), '1970-01-01'),
                COALESCE(MAX(buddycare_date), '1970-01-01'),
                COALESCE(MAX(healthconnex_date), '1970-01-01')
               ) as file_time FROM telemed`;

        const [platformRows]: any = await pool.query(platformQuery, year ? [year] : []);
        let fileTime = platformRows[0]?.file_time;

        // หากปีงบที่เลือกยังไม่มีข้อมูล ให้ดึงวันที่ล่าสุดของ Platform ในระบบ
        if (!fileTime || fileTime === '1970-01-01') {
            const [overallPlatform]: any = await pool.query(`
                SELECT GREATEST(
                    COALESCE(MAX(moph_date), '1970-01-01'),
                    COALESCE(MAX(buddycare_date), '1970-01-01'),
                    COALESCE(MAX(healthconnex_date), '1970-01-01')
                ) as file_time 
                FROM telemed
            `);
            fileTime = overallPlatform[0]?.file_time !== '1970-01-01' ? overallPlatform[0]?.file_time : null;
        }

        return NextResponse.json({
            lastUpdate: fileTime || null
        });
    } catch (error: any) {
        console.error('Database error in last-update:', error);
        return NextResponse.json({
            error: 'Database connection failed',
            details: error.message
        }, { status: 500 });
    }
}
