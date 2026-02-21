// Test script to see how XLSX parses the uploaded file and if our mapping works
import * as XLSX from 'xlsx';

// Mock some data that looks like the Excel file based on User Request
const ws = XLSX.utils.aoa_to_sheet([
    ['จังหวัด', 'หน่วยบริการ', 'หมอพร้อม station', 'สอน.บัดดี้', 'ปีงบประมาณ'],
    ['พิษณุโลก', 7476, 10, 5, 2569],
    ['พิษณุโลก', '07476', 20, 10, 2569],
    ['กรุงเทพ', 12345, 100, 50, 2568]
]);

const wb = XLSX.utils.book_new();
XLSX.utils.book_append_sheet(wb, ws, "Sheet1");

const rawData = XLSX.utils.sheet_to_json(ws);
console.log("rawData:", rawData);

const filteredData = rawData.filter(row => {
    const province = row['จังหวัด'] || '';
    return province === 'พิษณุโลก';
});

console.log("filteredData:", filteredData);

const values = filteredData.map(row => {
    const rawHospcode = String(row['รหัส'] || row['หน่วยบริการ'] || row['hospcode'] || '');
    const hospcode = rawHospcode.padStart(5, '0');
    const b_year = String(row['ปีงบประมาณ'] || row['b_year'] || '');
    const moph = parseInt(row['หมอพร้อม station'] || row['moph'] || '0');
    const buddycare = parseInt(row['สอน.บัดดี้'] || row['buddycare'] || '0');
    const id = `${hospcode}_${b_year}`;
    const result = moph + buddycare;

    return [id, hospcode, b_year, moph, buddycare, result];
});

console.log("values mapping:", values);
