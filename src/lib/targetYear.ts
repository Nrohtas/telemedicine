import pool from '@/lib/db';

/**
 * คืนค่าปีงบประมาณเป้าหมายจากตาราง target
 * หากปีที่ร้องขอ (requestedYear) มีข้อมูลเป้าหมายในตาราง target จะใช้ปีนั้น
 * หากยังไม่มีข้อมูล (เช่น ยังไม่ได้ประกาศเป้าหมายใหม่ของปีนั้น) จะใช้ปีล่าสุดที่มีข้อมูลในระบบ (fallback)
 */
export async function getTargetYear(requestedYear: string = '2569'): Promise<string> {
    try {
        const [rows]: any = await pool.query(
            `SELECT b_year FROM target WHERE b_year = ? 
             UNION ALL 
             SELECT b_year FROM target WHERE b_year <= ? 
             ORDER BY b_year DESC LIMIT 1`,
            [requestedYear, requestedYear]
        );
        if (rows && rows.length > 0 && rows[0].b_year) {
            return String(rows[0].b_year);
        }
    } catch (e) {
        console.error('Error resolving target year:', e);
    }
    return requestedYear;
}
