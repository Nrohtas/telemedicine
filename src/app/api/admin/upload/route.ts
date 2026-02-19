import { NextRequest, NextResponse } from 'next/server';
import pool from '@/lib/db';
import * as XLSX from 'xlsx';

export async function POST(request: NextRequest) {
    try {
        const formData = await request.formData();
        const file = formData.get('file') as File;

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
