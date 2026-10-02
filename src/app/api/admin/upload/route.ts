import { NextRequest, NextResponse } from 'next/server';
import pool from '@/lib/db';
import * as XLSX from 'xlsx';
import { verifyJWT } from '@/lib/auth';

const cleanExcelDate = (val: any, defaultDate: string | null): string | null => {
    if (val === undefined || val === null || val === '') return defaultDate;
    
    if (typeof val === 'number') {
        const dateObj = new Date((val - 25569) * 86400 * 1000);
        if (!isNaN(dateObj.getTime())) {
            return dateObj.toISOString().split('T')[0];
        }
    }
    
    if (val instanceof Date && !isNaN(val.getTime())) {
        return val.toISOString().split('T')[0];
    }
    
    const dateStr = String(val).trim();
    const dmyPattern = /^(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{4})$/;
    const dmyMatch = dateStr.match(dmyPattern);
    if (dmyMatch) {
        let year = parseInt(dmyMatch[3]);
        if (year > 2400) year -= 543;
        const day = dmyMatch[1].padStart(2, '0');
        const month = dmyMatch[2].padStart(2, '0');
        return `${year}-${month}-${day}`;
    }

    try {
        const dateObj = new Date(dateStr);
        if (!isNaN(dateObj.getTime())) {
            return dateObj.toISOString().split('T')[0];
        }
    } catch (e) {}

    return defaultDate;
};

const getThaiFiscalYear = (dateStr?: string | null): string => {
    if (!dateStr) return '2570';
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return '2570';
    const yearCE = d.getFullYear();
    const month = d.getMonth() + 1; // 1-12
    const fiscalYear = month >= 10 ? yearCE + 544 : yearCE + 543;
    return fiscalYear.toString();
};

export async function POST(request: NextRequest) {
    try {
        // Authenticate request
        let token = request.cookies.get('token')?.value;

        if (!token) {
            const authHeader = request.headers.get('Authorization');
            if (authHeader?.startsWith('Bearer ')) {
                token = authHeader.split(' ')[1];
            }
        }

        if (!token) {
            return NextResponse.json({ error: 'Unauthorized: No token provided' }, { status: 401 });
        }

        const payload = await verifyJWT(token);
        if (!payload) {
            return NextResponse.json({ error: 'Unauthorized: Invalid token' }, { status: 401 });
        }

        const username = payload.username || 'system';

        const formData = await request.formData();
        const file = formData.get('file') as File;
        const type = formData.get('type') as string || 'Telemedicine';
        const date = formData.get('date') as string || null;

        if (!file) {
            return NextResponse.json({ error: 'No file uploaded' }, { status: 400 });
        }

        const isCsv = file.name.toLowerCase().endsWith('.csv');
        let rawData: any[] = [];

        if (isCsv) {
            const arrayBuffer = await file.arrayBuffer();
            const buffer = Buffer.from(arrayBuffer);
            
            let csvText = '';
            try {
                const iconv = await import('iconv-lite');
                // Detect if it is UTF-8 or TIS-620 by looking for common Thai or header words
                const utf8Text = buffer.toString('utf8');
                if (
                    utf8Text.includes('พิษณุโลก') || 
                    utf8Text.includes('จังหวัด') || 
                    utf8Text.includes('hospcode') || 
                    utf8Text.includes('opd') || 
                    utf8Text.includes('telemedicine')
                ) {
                    csvText = utf8Text;
                } else {
                    const tis620Text = iconv.decode(buffer, 'tis-620');
                    if (
                        tis620Text.includes('พิษณุโลก') || 
                        tis620Text.includes('จังหวัด') || 
                        tis620Text.includes('hospcode') || 
                        tis620Text.includes('opd') || 
                        tis620Text.includes('telemedicine')
                    ) {
                        csvText = tis620Text;
                    } else {
                        csvText = utf8Text;
                    }
                }
            } catch (err) {
                csvText = buffer.toString('utf8');
            }

            const workbook = XLSX.read(csvText, { type: 'string' });
            const sheetName = workbook.SheetNames[0];
            const worksheet = workbook.Sheets[sheetName];
            rawData = XLSX.utils.sheet_to_json(worksheet);
        } else {
            const buffer = await file.arrayBuffer();
            const workbook = XLSX.read(buffer, { type: 'buffer' });
            const sheetName = workbook.SheetNames[0];
            const worksheet = workbook.Sheets[sheetName];
            rawData = XLSX.utils.sheet_to_json(worksheet);
        }

        if (rawData.length === 0) {
            return NextResponse.json({ error: 'Excel/CSV file is empty' }, { status: 400 });
        }

        console.log("=== RAW DATA FIRST ROW ===");
        console.dir(rawData[0]);

        let results: any;
        let importedCount = 0;

        if (type === 'HDC' || type === 'HDC_PHEOC') {
            const hdcTable = type === 'HDC' ? 'telemed_opd_hdc' : 'telemed_opd_hdc_pheoc';
            // Processing for HDC (telemed_opd_hdc or telemed_opd_hdc_pheoc table)
            const targetBYear = getThaiFiscalYear(date);

            const hdcValues = rawData.map((row, index) => {
                // Helper to find key by partial match (case-insensitive)
                const findKey = (keywords: string[]) => {
                    const lowerKeywords = keywords.map(kw => kw.toLowerCase());
                    return Object.keys(row).find(k => {
                        const normalizedKey = k.trim().replace(/\s+/g, ' ').toLowerCase();
                        return lowerKeywords.some(kw => normalizedKey.includes(kw));
                    });
                };

                const cleanPercent = (val: any) => {
                    if (val === undefined || val === null || val === '') return 0;
                    
                    // If the value is a number (e.g. parsed from Excel percentage formats as 0.1469)
                    if (typeof val === 'number') {
                        // If it's a ratio <= 1.0 (excluding 0), convert it to raw percentage number (e.g. 14.69)
                        if (val > 0 && val <= 1.0) {
                            return val * 100;
                        }
                        return val;
                    }
                    
                    // Strip % sign and commas, then parse as float
                    let cleaned = String(val).replace(/%/g, '').replace(/,/g, '').trim();
                    let num = parseFloat(cleaned) || 0;
                    
                    // If the string was already a ratio like "0.1469" without % sign
                    if (num > 0 && num <= 1.0 && String(val).includes('.')) {
                        if (!String(val).includes('%')) {
                            return num * 100;
                        }
                    }
                    
                    return num;
                };

                if (isCsv) {
                    // NEW CONDITION FOR CSV UPLOADS:
                    // 1. Filter by province = 'พิษณุโลก'
                    const provinceKey = findKey(['จังหวัด', 'province', 'provname']);
                    if (provinceKey) {
                        const provinceVal = String(row[provinceKey] || '').trim();
                        if (!provinceVal || !provinceVal.includes('พิษณุโลก')) {
                            return null;
                        }
                    }

                    // 2. Map new fields
                    const hospcodeKey = findKey(['hospital_code', 'hospcode']);
                    const opdKey = findKey(['OPD', 'opd']);
                    const teleKey = findKey(['HDC', 'telemedicine']);
                    const percentKey = findKey(['percent_hdc_opd', 'percent']);

                    const rawHospcode = String(row[hospcodeKey || ''] || '');
                    if (!rawHospcode || rawHospcode === 'undefined' || rawHospcode.includes('รวม')) return null;

                    const hospcode = rawHospcode.padStart(5, '0');

                    const cleanNumber = (val: any) => {
                        if (val === undefined || val === null || val === '') return 0;
                        if (typeof val === 'number') return Math.floor(val);
                        const cleaned = String(val).replace(/,/g, '').trim();
                        return Math.floor(parseFloat(cleaned) || 0);
                    };

                    const opd = cleanNumber(row[opdKey || '']);
                    const telemedicine = cleanNumber(row[teleKey || '']);
                    const id = `${hospcode}_${targetBYear}`;
                    
                    let percent = 0;
                    if (percentKey && row[percentKey] !== undefined && row[percentKey] !== null && row[percentKey] !== '') {
                        percent = cleanPercent(row[percentKey]);
                    } else {
                        percent = opd > 0 ? (telemedicine * 100) / opd : 0;
                    }

                    return [id, hospcode, targetBYear, opd, telemedicine, percent, date, new Date()];

                } else {
                    // ORIGINAL CONDITION FOR EXCEL UPLOADS (RETAINED):
                    const hospcodeKey = findKey(['รหัสหน่วยบริการ', 'hospcode']);
                    const opdKey = findKey(['ยอด OPD', 'opd', 'ยอดOPD']);
                    const teleKey = findKey(['Telemedicine', 'telemedicine']);
                    const percentKey = findKey(['percent_hdc_opd', 'percent']);

                    const rawHospcode = String(row[hospcodeKey || ''] || '');
                    if (!rawHospcode || rawHospcode === 'undefined' || rawHospcode.includes('รวม')) return null;

                    const hospcode = rawHospcode.padStart(5, '0');

                    const cleanNumber = (val: any) => {
                        if (val === undefined || val === null || val === '') return 0;
                        if (typeof val === 'number') return Math.floor(val);
                        const cleaned = String(val).replace(/,/g, '').trim();
                        return Math.floor(parseFloat(cleaned) || 0);
                    };

                    const opd = cleanNumber(row[opdKey || '']);
                    const telemedicine = cleanNumber(row[teleKey || '']);
                    const id = `${hospcode}_${targetBYear}`;
                    
                    let percent = 0;
                    if (percentKey && row[percentKey] !== undefined && row[percentKey] !== null && row[percentKey] !== '') {
                        percent = cleanPercent(row[percentKey]);
                    } else {
                        percent = opd > 0 ? (telemedicine * 100) / opd : 0;
                    }

                    return [id, hospcode, targetBYear, opd, telemedicine, percent, date, new Date()];
                }
            }).filter(item => item !== null);

            if (hdcValues.length === 0) {
                return NextResponse.json({ error: 'ไม่พบข้อมูล HDC จังหวัดพิษณุโลก หรือรูปแบบไฟล์ไม่ถูกต้อง' }, { status: 400 });
            }

            const hdcQuery = `
                INSERT INTO ${hdcTable} (id, hospcode, b_year, opd, telemedicine, percent, hdc_update, d_update)
                VALUES ?
                ON DUPLICATE KEY UPDATE
                    id = VALUES(id),
                    opd = VALUES(opd),
                    telemedicine = VALUES(telemedicine),
                    percent = VALUES(percent),
                    hdc_update = VALUES(hdc_update),
                    d_update = VALUES(d_update)
            `;

            [results] = await pool.query(hdcQuery, [hdcValues]);
            importedCount = hdcValues.length;

        } else {
            // Helper to find key by partial match
            const findKeyInRow = (row: any, keywords: string[]) => {
                return Object.keys(row).find(k =>
                    keywords.some(kw => k.trim().replace(/\s+/g, ' ').includes(kw))
                );
            };

            const filteredData = rawData.filter(row => {
                const provinceKey = findKeyInRow(row, ['จังหวัด', 'province', 'provname']);
                if (!provinceKey) return false;
                const province = String(row[provinceKey] || '').trim();
                return province === 'พิษณุโลก' || province.includes('พิษณุโลก');
            });

            if (filteredData.length === 0) {
                // If no "จังหวัด" column found or no matches, check if we should just skip filtering 
                // if the file is known to be only for Phitsanulok
                console.log("No data found for พิษณุโลก. Row keys:", Object.keys(rawData[0]));
                return NextResponse.json({ error: 'ไม่พบข้อมูลจังหวัดพิษณุโลกในไฟล์ หรือ ชื่อคอลัมน์จังหวัดไม่ถูกต้อง' }, { status: 400 });
            }

            const aggregatedData: Record<string, any> = {};

            filteredData.forEach(row => {
                const hospcodeKey = findKeyInRow(row, ['รหัส 5 หลัก', 'รหัส', 'หน่วยบริการ', 'hospcode']);
                const byearKey = findKeyInRow(row, ['ปีงบประมาณ', 'b_year']);
                const platformKey = findKeyInRow(row, ['แพลตฟอร์ม', 'platform']);
                const countKey = findKeyInRow(row, ['จำนวนนัด Telemed', 'จำนวน', 'count']);
                const dateKey = findKeyInRow(row, ['วันอัปเดต', 'วันที่', 'date_update', 'update_date', 'd_update', 'date']);

                const rawHospcode = String(row[hospcodeKey || ''] || '');
                if (!rawHospcode || rawHospcode === 'undefined' || rawHospcode.includes('รวม')) return;

                const hospcode = rawHospcode.padStart(5, '0');
                const rowDate = cleanExcelDate(dateKey ? row[dateKey] : null, date);
                const b_year = String(row[byearKey || ''] || '').trim() || getThaiFiscalYear(rowDate || date);
                const platform = String(row[platformKey || ''] || '').trim().toLowerCase();
                const count = parseInt(row[countKey || ''] || '0') || 0;

                const id = `${hospcode}_${b_year}`;

                if (!aggregatedData[id]) {
                    aggregatedData[id] = { id, hospcode, b_year, moph: 0, buddycare: 0, hdc: 0, healthconnex: 0, rowDate: rowDate };
                } else if (rowDate && (!aggregatedData[id].rowDate || rowDate > aggregatedData[id].rowDate)) {
                    aggregatedData[id].rowDate = rowDate;
                }

                if (platform.includes('หมอพร้อม') || platform.includes('moph')) {
                    aggregatedData[id].moph += count;
                } else if (platform.includes('บัดดี้') || platform.includes('buddy')) {
                    aggregatedData[id].buddycare += count;
                } else if (platform.includes('hdc') || platform.includes('เอชดีซี')) {
                    aggregatedData[id].hdc += count;
                } else if (platform.includes('health') || platform.includes('connex') || platform.includes('healthconnex') || platform.includes('เฮลท์') || platform.includes('คอนเน็กซ์')) {
                    aggregatedData[id].healthconnex += count;
                }
            });

            const compareQuery = `
                INSERT INTO telemed (
                    id, hospcode, b_year, 
                    moph, buddycare, hdc, healthconnex, result, 
                    moph_date, buddycare_date, hdc_date, healthconnex_date, result_date
                )
                VALUES ?
                ON DUPLICATE KEY UPDATE
                    moph_compare = CASE WHEN VALUES(moph) > 0 THEN VALUES(moph) - COALESCE(moph, 0) ELSE 0 END,
                    buddycare_compare = CASE WHEN VALUES(buddycare) > 0 THEN VALUES(buddycare) - COALESCE(buddycare, 0) ELSE 0 END,
                    result_compare = CASE WHEN (
                        VALUES(moph) > 0 OR 
                        VALUES(buddycare) > 0 OR 
                        VALUES(hdc) > 0 OR 
                        VALUES(healthconnex) > 0
                    ) THEN (
                        CASE WHEN VALUES(moph) > 0 THEN VALUES(moph) ELSE COALESCE(moph, 0) END + 
                        CASE WHEN VALUES(buddycare) > 0 THEN VALUES(buddycare) ELSE COALESCE(buddycare, 0) END +
                        CASE WHEN VALUES(hdc) > 0 THEN VALUES(hdc) ELSE COALESCE(hdc, 0) END +
                        CASE WHEN VALUES(healthconnex) > 0 THEN VALUES(healthconnex) ELSE COALESCE(healthconnex, 0) END
                    ) - COALESCE(result, 0) ELSE 0 END,
                    percentage = CASE WHEN (
                        VALUES(moph) > 0 OR 
                        VALUES(buddycare) > 0 OR 
                        VALUES(hdc) > 0 OR 
                        VALUES(healthconnex) > 0
                    ) AND COALESCE(result, 0) > 0 THEN (
                        ((
                            CASE WHEN VALUES(moph) > 0 THEN VALUES(moph) ELSE COALESCE(moph, 0) END + 
                            CASE WHEN VALUES(buddycare) > 0 THEN VALUES(buddycare) ELSE COALESCE(buddycare, 0) END +
                            CASE WHEN VALUES(hdc) > 0 THEN VALUES(hdc) ELSE COALESCE(hdc, 0) END +
                            CASE WHEN VALUES(healthconnex) > 0 THEN VALUES(healthconnex) ELSE COALESCE(healthconnex, 0) END
                        ) - COALESCE(result, 0)) / COALESCE(result, 0)
                    ) * 100 ELSE percentage END,
                    moph_past = CASE WHEN VALUES(moph) > 0 THEN COALESCE(moph, 0) ELSE moph_past END,
                    moph_past_date = CASE WHEN VALUES(moph) > 0 THEN moph_date ELSE moph_past_date END,
                    buddycare_past = CASE WHEN VALUES(buddycare) > 0 THEN COALESCE(buddycare, 0) ELSE buddycare_past END,
                    buddycare_past_date = CASE WHEN VALUES(buddycare) > 0 THEN buddycare_date ELSE buddycare_past_date END,
                    hdc_past = CASE WHEN VALUES(hdc) > 0 THEN COALESCE(hdc, 0) ELSE hdc_past END,
                    hdc_past_date = CASE WHEN VALUES(hdc) > 0 THEN hdc_date ELSE hdc_past_date END,
                    healthconnex_past = CASE WHEN VALUES(healthconnex) > 0 THEN COALESCE(healthconnex, 0) ELSE healthconnex_past END,
                    healthconnex_past_date = CASE WHEN VALUES(healthconnex) > 0 THEN healthconnex_date ELSE healthconnex_past_date END,
                    result_past = CASE WHEN (
                        VALUES(moph) > 0 OR 
                        VALUES(buddycare) > 0 OR 
                        VALUES(hdc) > 0 OR 
                        VALUES(healthconnex) > 0
                    ) THEN COALESCE(result, 0) ELSE result_past END,
                    result_past_date = CASE WHEN (
                        VALUES(moph) > 0 OR 
                        VALUES(buddycare) > 0 OR 
                        VALUES(hdc) > 0 OR 
                        VALUES(healthconnex) > 0
                    ) THEN result_date ELSE result_past_date END,
                    b_year = VALUES(b_year),
                    moph = CASE WHEN VALUES(moph) > 0 THEN VALUES(moph) ELSE moph END,
                    buddycare = CASE WHEN VALUES(buddycare) > 0 THEN VALUES(buddycare) ELSE buddycare END,
                    hdc = CASE WHEN VALUES(hdc) > 0 THEN VALUES(hdc) ELSE hdc END,
                    healthconnex = CASE WHEN VALUES(healthconnex) > 0 THEN VALUES(healthconnex) ELSE healthconnex END,
                    result = CASE WHEN (
                        VALUES(moph) > 0 OR 
                        VALUES(buddycare) > 0 OR 
                        VALUES(hdc) > 0 OR 
                        VALUES(healthconnex) > 0
                    ) THEN (
                        CASE WHEN VALUES(moph) > 0 THEN VALUES(moph) ELSE COALESCE(moph, 0) END + 
                        CASE WHEN VALUES(buddycare) > 0 THEN VALUES(buddycare) ELSE COALESCE(buddycare, 0) END +
                        CASE WHEN VALUES(hdc) > 0 THEN VALUES(hdc) ELSE COALESCE(hdc, 0) END +
                        CASE WHEN VALUES(healthconnex) > 0 THEN VALUES(healthconnex) ELSE COALESCE(healthconnex, 0) END
                    ) ELSE result END,
                    moph_date = CASE WHEN VALUES(moph) > 0 THEN VALUES(moph_date) ELSE moph_date END,
                    buddycare_date = CASE WHEN VALUES(buddycare) > 0 THEN VALUES(buddycare_date) ELSE buddycare_date END,
                    hdc_date = CASE WHEN VALUES(hdc) > 0 THEN VALUES(hdc_date) ELSE hdc_date END,
                    healthconnex_date = CASE WHEN VALUES(healthconnex) > 0 THEN VALUES(healthconnex_date) ELSE healthconnex_date END,
                    result_date = CASE WHEN (
                        VALUES(moph) > 0 OR 
                        VALUES(buddycare) > 0 OR 
                        VALUES(hdc) > 0 OR 
                        VALUES(healthconnex) > 0
                    ) THEN VALUES(result_date) ELSE result_date END
            `;

            const compareValues = Object.values(aggregatedData).map((item: any) => {
                const result = item.moph + item.buddycare + item.hdc + item.healthconnex;
                const rowDate = item.rowDate || date;
                return [
                    item.id, 
                    item.hospcode, 
                    item.b_year, 
                    item.moph, 
                    item.buddycare, 
                    item.hdc,
                    item.healthconnex,
                    result, 
                    rowDate, 
                    rowDate, 
                    rowDate, 
                    rowDate, 
                    rowDate
                ];
            });

            [results] = await pool.query(compareQuery, [compareValues]);
            importedCount = filteredData.length;
        }

        // Log to fileupload table
        try {
            // Determine fiscal year for logging
            const targetBYear = getThaiFiscalYear(date);
            const excelBYear = rawData[0]['ปีงบประมาณ'] || rawData[0]['b_year'];
            const logType = excelBYear ? String(excelBYear).trim() : ((type === 'HDC' || type === 'HDC_PHEOC') ? targetBYear : 'Telemed');

            // Determine file_platform based on type
            const file_platform = type === 'HDC' ? 'hdc' : (type === 'HDC_PHEOC' ? 'hdc_pheoc' : 'platform');

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
