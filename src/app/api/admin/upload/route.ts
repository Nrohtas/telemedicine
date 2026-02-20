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
        const data: any[] = XLSX.utils.sheet_to_json(worksheet);

        if (data.length === 0) {
            return NextResponse.json({ error: 'Excel file is empty' }, { status: 400 });
        }

        // Prepare for UPSERT
        // id, hospcode, b_year, moph, buddycare, result
        const values = data.map(row => [
            row.id,
            row.hospcode,
            row.b_year,
            row.moph || 0,
            row.buddycare || 0,
            row.result || 0
        ]);

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
                type
            ]);
        } catch (logError) {
            console.error('Failed to log file upload:', logError);
            // Don't fail the whole request if logging fails
        }

        return NextResponse.json({
            success: true,
            count: results.affectedRows,
            message: 'Data synchronized successfully'
        });

    } catch (error: any) {
        console.error('Excel upload error:', error);
        return NextResponse.json({ error: error.message || 'Error processing Excel file' }, { status: 500 });
    }
}
