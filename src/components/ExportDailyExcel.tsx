"use client";

import React from 'react';
import * as XLSX from 'xlsx';

interface DailyDistrictRow {
  amp_code: string;
  amp_name: string;
  platform_target: number;
  platform_result: number;
  platform_percent: number;
  visit_type_2: number;
  visit_type_3: number;
  visit_type_5: number;
  total: number;
  percent: number;
  hdc_opd: number;
  hdc_result: number;
  hdc_percent: number;
  diff_platform_his: number;
  diff_hdc_his: number;
}

interface ExportDailyExcelProps {
    data: DailyDistrictRow[];
    policy?: string;
}

const ExportDailyExcel = ({ data, policy }: ExportDailyExcelProps) => {
    const handleExport = () => {
        const exportData = data.map(row => ({
            'รหัสอำเภอ': row.amp_code,
            'อำเภอ': row.amp_name,
            'เป้าหมาย (Platform)': row.platform_target,
            'ผลงาน (Platform)': row.platform_result,
            '% (Platform)': Number(row.platform_percent.toFixed(2)),
            'มาตามนัด(2)': row.visit_type_2,
            'รับส่งต่อ(3)': row.visit_type_3,
            'Tele(5)': row.visit_type_5,
            'รวม 2,3,5 (HIS)': row.total,
            '% (HIS)': Number(row.percent.toFixed(2)),
            'OPD (HDC)': row.hdc_opd,
            'Tele (HDC)': row.hdc_result,
            '% (HDC)': Number(row.hdc_percent.toFixed(2)),
            'HDC - PLATFORM': row.hdc_result - row.platform_result,
            'HDC - HIS': row.hdc_result - row.visit_type_5
        }));

        const ws = XLSX.utils.json_to_sheet(exportData);
        const wb = XLSX.utils.book_new();
        
        const policyLabel = policy === "pheoc" ? "PHEOC" : "TMM";
        XLSX.utils.book_append_sheet(wb, ws, `DailySummary_${policyLabel}`);
        
        // Generate filename with current date and time
        const now = new Date();
        const dateStr = now.toISOString().split('T')[0];
        const timeStr = now.getHours().toString().padStart(2, '0') + 
                       now.getMinutes().toString().padStart(2, '0');
        XLSX.writeFile(wb, `Telemedicine_Daily_Summary_${policyLabel}_${dateStr}_${timeStr}.xlsx`);
    };

    return (
        <button
            onClick={handleExport}
            className="inline-flex items-center gap-2 bg-emerald-600 text-white px-4 py-2 rounded-xl text-sm font-bold shadow-lg shadow-emerald-100 hover:bg-emerald-700 hover:scale-105 active:scale-95 transition-all cursor-pointer"
        >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                <polyline points="7 10 12 15 17 10"></polyline>
                <line x1="12" y1="15" x2="12" y2="3"></line>
            </svg>
            Export Excel
        </button>
    );
};

export default ExportDailyExcel;
