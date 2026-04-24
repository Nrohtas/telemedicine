import { NextRequest, NextResponse } from 'next/server';
import pool from '@/lib/db';
import AdmZip from 'adm-zip';
import iconv from 'iconv-lite';

export async function POST(request: NextRequest) {
    try {
        const formData = await request.formData();
        const file = formData.get('file') as File;

        if (!file) {
            return NextResponse.json({ error: 'ไม่พบไฟล์ที่อัปโหลด' }, { status: 400 });
        }

        // Validate filename: must match F43_*.zip (case-insensitive)
        if (!/^f43_.+\.zip$/i.test(file.name)) {
            return NextResponse.json(
                { error: `ชื่อไฟล์ไม่ถูกต้อง: "${file.name}" — ต้องเป็น F43_XXX.ZIP` },
                { status: 400 }
            );
        }

        const buffer = Buffer.from(await file.arrayBuffer());
        const zip = new AdmZip(buffer);
        const zipEntries = zip.getEntries();

        const token = request.cookies.get('token')?.value;
        const payload = token ? await (async () => {
            const { verifyJWT } = await import('@/lib/auth');
            return await verifyJWT(token);
        })() : null;
        const username = payload?.username || 'system';

        // Process SERVICE.TXT only
        const serviceEntry = zipEntries.find(entry =>
            entry.entryName.toLowerCase() === 'service.txt' ||
            entry.entryName.toLowerCase().endsWith('/service.txt')
        );

        if (!serviceEntry) {
            return NextResponse.json(
                { error: 'ไม่พบ SERVICE.TXT ใน ZIP ที่อัปโหลด' },
                { status: 400 }
            );
        }

        const contentBuffer = serviceEntry.getData();
        let content = '';
        const utf8Try = contentBuffer.toString('utf8');
        if (/[ก-ฮ]/.test(utf8Try)) {
            content = utf8Try;
        } else {
            content = iconv.decode(contentBuffer, 'tis-620');
        }

        const lines = content.split(/\r?\n/);
        let startIndex = 0;
        if (lines.length > 0 && lines[0].toUpperCase().includes('HOSPCODE') && lines[0].toUpperCase().includes('PID')) {
            startIndex = 1;
        }

        const targetColumns = ['HOSPCODE', 'PID', 'SEQ', 'DATE_SERV', 'TYPEIN', 'D_UPDATE'];
        const fieldIndices = [0, 1, 3, 4, 11, 28];

        const dataToInsert: any[][] = [];
        for (let i = startIndex; i < lines.length; i++) {
            const line = lines[i].trim();
            if (!line) continue;
            const fields = line.split('|');

            const row = targetColumns.map((colName, colIdx) => {
                const originalIdx = fieldIndices[colIdx];
                let val = fields[originalIdx] ? fields[originalIdx].trim() : null;

                if (colName === 'DATE_SERV' || colName === 'D_UPDATE') {
                    if (val && val.length === 8) val = `${val.substring(0, 4)}-${val.substring(4, 6)}-${val.substring(6, 8)}`;
                    else if (val && val.length === 14) val = `${val.substring(0, 4)}-${val.substring(4, 6)}-${val.substring(6, 8)} ${val.substring(8, 10)}:${val.substring(10, 12)}:${val.substring(12, 14)}`;
                }
                return (val === '' || val === null) ? null : val;
            });
            dataToInsert.push(row);
        }

        if (dataToInsert.length > 0) {
            const query = `INSERT INTO service (${targetColumns.join(', ')}) VALUES ? ON DUPLICATE KEY UPDATE HOSPCODE=VALUES(HOSPCODE), PID=VALUES(PID), SEQ=VALUES(SEQ), DATE_SERV=VALUES(DATE_SERV), TYPEIN=VALUES(TYPEIN), D_UPDATE=VALUES(D_UPDATE)`;
            await pool.query(query, [dataToInsert]);
        }

        // Log Upload
        try {
            const logQuery = `INSERT INTO fileupload (file_name, file_type, file_size, file_time, username, file_log) VALUES (?, ?, ?, NOW(), ?, ?)`;
            await pool.query(logQuery, [file.name, 'zip', file.size / 1024, username, '43FILE']);
        } catch (e) {}

        return NextResponse.json({
            success: true,
            message: `นำเข้าสำเร็จ: service.txt (${dataToInsert.length} records)`,
            count: dataToInsert.length
        });

    } catch (error: any) {
        console.error('43file upload error:', error);
        return NextResponse.json({ error: error.message || 'เกิดข้อผิดพลาดในการประมวลผลไฟล์' }, { status: 500 });
    }
}
