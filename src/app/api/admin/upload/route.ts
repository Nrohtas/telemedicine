import { NextRequest, NextResponse } from 'next/server';
import pool from '@/lib/db';
import * as XLSX from 'xlsx';

export async function POST(request: NextRequest) {
    try {
        const formData = await request.formData();
        const file = formData.get('file') as File;
        const type = formData.get('type') as string || 'Telemedicine';

        if (!file) {
            return NextResponse.json({ error: 'No file uploaded' }, { status: 400 });
        }

        const buffer = await file.arrayBuffer();
        const workbook = XLSX.read(buffer, { type: 'buffer' });
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        const rawData: any[] = XLSX.utils.sheet_to_json(worksheet);

        if (rawData.length === 0) {
            return NextResponse.json({ error: 'Excel file is empty' }, { status: 400 });
        }

        console.log("=== RAW DATA FIRST ROW ===");
        console.dir(rawData[0]);

        // Mapping and Filtering
        // จังหวัด (เฉพาะ พิษณุโลก)
        // รหัส -> hospcode (รหัสไม่ครบ 5 หลัก เติม 0 ด้านหน้า)
        // หมอพร้อม station -> moph
        // สอน.บัดดี้ -> buddycare
        // ปีงบประมาณ -> b_year
        // ID -> hospcode_b_year

        const filteredData = rawData.filter(row => {
            const province = String(row['จังหวัด'] || '').trim();
            return province === 'พิษณุโลก';
        });

        if (filteredData.length === 0) {
            return NextResponse.json({ error: 'No data found for พิษณุโลก' }, { status: 400 });
        }

        const aggregatedData: Record<string, any> = {};

        filteredData.forEach(row => {
            const rawHospcode = String(row['รหัส 5 หลัก'] || row['รหัส'] || row['หน่วยบริการ'] || row['hospcode'] || '');
            if (!rawHospcode || rawHospcode === 'undefined') return;

            const hospcode = rawHospcode.padStart(5, '0');
            const b_year = String(row['ปีงบประมาณ'] || row['b_year'] || '');
            const platform = String(row['แพลตฟอร์ม'] || '').trim();
            const count = parseInt(row['จำนวนนัด Telemed'] || row['จำนวน'] || '0') || 0;

            const id = `${hospcode}_${b_year}`;

            if (!aggregatedData[id]) {
                aggregatedData[id] = { id, hospcode, b_year, moph: 0, buddycare: 0 };
            }

            if (platform === 'หมอพร้อม station' || platform === 'หมอพร้อม') {
                aggregatedData[id].moph += count;
            } else if (platform === 'สอน.บัดดี้' || platform === 'สอน.บัดดี') {
                aggregatedData[id].buddycare += count;
            }
        });

        const values = Object.values(aggregatedData).map((item: any) => {
            const result = item.moph + item.buddycare;
            return [item.id, item.hospcode, item.b_year, item.moph, item.buddycare, result];
        });

        if (values.length === 0) {
            return NextResponse.json({ error: 'No valid data to import after extraction.' }, { status: 400 });
        }

        const query = `
            INSERT INTO telemedicine.telemedicine (id, hospcode, b_year, moph, buddycare, result)
            VALUES ?
            ON DUPLICATE KEY UPDATE
                b_year = VALUES(b_year),
                moph = VALUES(moph),
                buddycare = VALUES(buddycare),
                result = VALUES(result)
        `;

        const [results]: any = await pool.query(query, [values]);

        // Log to fileupload table
        try {
            const token = request.cookies.get('token')?.value;
            const payload = token ? await (async () => {
                const { verifyJWT } = await import('@/lib/auth');
                return await verifyJWT(token);
            })() : null;
            const username = payload?.username || 'system';
            const logType = filteredData[0]['ปีงบประมาณ'] || type;

            const logQuery = `
                INSERT INTO telemedicine.fileupload 
                (file_name, file_type, file_size, file_time, username, file_log)
                VALUES (?, ?, ?, NOW(), ?, ?)
            `;
            await pool.query(logQuery, [
                file.name,
                file.type.substring(0, 10),
                file.size / 1024, // KB
                username,
                logType
            ]);
        } catch (logError) {
            console.error('Failed to log file upload:', logError);
        }

        return NextResponse.json({
            success: true,
            count: results.affectedRows,
            imported: filteredData.length,
            message: 'Data synchronized successfully'
        });

    } catch (error: any) {
        console.error('Excel upload error:', error);
        return NextResponse.json({ error: error.message || 'Error processing Excel file' }, { status: 500 });
    }
}
