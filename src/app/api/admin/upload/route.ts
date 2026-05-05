import { NextRequest, NextResponse } from 'next/server';
import pool from '@/lib/db';
import * as XLSX from 'xlsx';

export async function POST(request: NextRequest) {
    try {
        const formData = await request.formData();
        const file = formData.get('file') as File;
        const type = formData.get('type') as string || 'Telemedicine';
        const date = formData.get('date') as string || null;

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

        let results: any;
        let importedCount = 0;

        if (type === 'HDC') {
            // Processing for HDC (telemed_hdc table)
            const targetBYear = date ? (new Date(date).getFullYear() + 543).toString() : '2569';

            const hdcValues = rawData.map((row, index) => {
                // Helper to find key by partial match
                const findKey = (keywords: string[]) => {
                    return Object.keys(row).find(k =>
                        keywords.some(kw => k.trim().replace(/\s+/g, ' ').includes(kw))
                    );
                };

                const hospcodeKey = findKey(['รหัสหน่วยบริการ', 'hospcode']);
                const opdKey = findKey(['ยอด OPD', 'opd', 'ยอดOPD']);
                const teleKey = findKey(['Telemedicine', 'telemedicine']);

                const rawHospcode = String(row[hospcodeKey || ''] || '');
                if (!rawHospcode || rawHospcode === 'undefined' || rawHospcode.includes('รวม')) return null;

                const hospcode = rawHospcode.padStart(5, '0');

                // Clean numeric strings (ensure absolute integer)
                const cleanNumber = (val: any) => {
                    if (val === undefined || val === null || val === '') return 0;
                    if (typeof val === 'number') return Math.floor(val);
                    // Remove commas and parse as float then floor to get integer
                    const cleaned = String(val).replace(/,/g, '').trim();
                    return Math.floor(parseFloat(cleaned) || 0);
                };

                const opd = cleanNumber(row[opdKey || '']);
                const telemedicine = cleanNumber(row[teleKey || '']);
                const id = `${hospcode}_${targetBYear}`;
                const percent = opd > 0 ? (telemedicine * 100) / opd : 0;

                return [id, hospcode, targetBYear, opd, telemedicine, percent, date, new Date()];
            }).filter(item => item !== null);

            if (hdcValues.length === 0) {
                return NextResponse.json({ error: 'No valid HDC data found in file' }, { status: 400 });
            }

            const hdcQuery = `
                INSERT INTO telemed_hdc (id, hospcode, b_year, target, result, percent, hdc_update, d_update)
                VALUES ?
                ON DUPLICATE KEY UPDATE
                    target = VALUES(target),
                    result = VALUES(result),
                    percent = VALUES(percent),
                    hdc_update = VALUES(hdc_update),
                    d_update = VALUES(d_update)
            `;

            [results] = await pool.query(hdcQuery, [hdcValues]);
            importedCount = hdcValues.length;

        } else {
            // Processing for Telemedicine (telemed table - Existing logic)
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

            const compareQuery = `
                INSERT INTO telemed (id, hospcode, b_year, moph, buddycare, result, moph_date, buddycare_date, result_date)
                VALUES ?
                ON DUPLICATE KEY UPDATE
                    moph_compare = VALUES(moph) - moph,
                    buddycare_compare = VALUES(buddycare) - buddycare,
                    result_compare = VALUES(result) - result,
                    percentage = CASE WHEN result > 0 THEN ((VALUES(result) - result) / result) * 100 ELSE 0 END,
                    moph_past = moph,
                    moph_past_date = moph_date,
                    buddycare_past = buddycare,
                    buddycare_past_date = buddycare_date,
                    result_past = result,
                    result_past_date = result_date,
                    b_year = VALUES(b_year),
                    moph = VALUES(moph),
                    buddycare = VALUES(buddycare),
                    result = VALUES(result),
                    moph_date = VALUES(moph_date),
                    buddycare_date = VALUES(buddycare_date),
                    result_date = VALUES(result_date)
            `;

            const compareValues = Object.values(aggregatedData).map((item: any) => {
                const result = item.moph + item.buddycare;
                return [item.id, item.hospcode, item.b_year, item.moph, item.buddycare, result, date, date, date];
            });

            [results] = await pool.query(compareQuery, [compareValues]);
            importedCount = filteredData.length;
        }

        // Log to fileupload table
        try {
            const token = request.cookies.get('token')?.value;
            const payload = token ? await (async () => {
                const { verifyJWT } = await import('@/lib/auth');
                return await verifyJWT(token);
            })() : null;
            const username = payload?.username || 'system';
            
            // Determine fiscal year for logging
            const targetBYear = date ? (new Date(date).getFullYear() + 543).toString() : '2569';
            const excelBYear = rawData[0]['ปีงบประมาณ'] || rawData[0]['b_year'];
            const logType = excelBYear ? String(excelBYear).trim() : (type === 'HDC' ? targetBYear : 'Telemed');

            // Determine file_platform based on type
            const file_platform = type === 'HDC' ? 'hdc' : 'moph_buddycare';

            const logQuery = `
                INSERT INTO fileupload 
                (file_name, file_type, file_size, file_time, username, file_log, file_platform)
                VALUES (?, ?, ?, NOW(), ?, ?, ?)
            `;
            await pool.query(logQuery, [
                file.name,
                file.name.split('.').pop()?.substring(0, 10) || '',
                file.size / 1024, // KB
                username,
                logType,
                file_platform
            ]);
        } catch (logError) {
            console.error('Failed to log file upload:', logError);
        }

        return NextResponse.json({
            success: true,
            count: results.affectedRows,
            imported: importedCount,
            message: 'Data synchronized successfully'
        });

    } catch (error: any) {
        console.error('Excel upload error:', error);
        return NextResponse.json({ error: error.message || 'Error processing Excel file' }, { status: 500 });
    }
}
