"use client";

import React from 'react';
import * as XLSX from 'xlsx';

interface DailyHospitalRow {
  hospcode: string;
  hospname: string;
  amp_code: string;
  amp_name: string;
  hostype_name: string;
  hostype_level: string;
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

interface ExportDailyHospitalsExcelProps {
  data: DailyHospitalRow[];
  policy?: string;
  view?: string;
}

const ExportDailyHospitalsExcel = ({ data, policy, view }: ExportDailyHospitalsExcelProps) => {
  const handleExport = () => {
    const exportRows = data.map((row, index) => ({
      "ลำดับ": index + 1,
      "รหัส": row.hospcode,
      "ชื่อหน่วยบริการ": row.hospname,
      "สังกัด": row.hostype_name || '-',
      "ประเภท": row.hostype_level || '-',
      "เป้าหมาย (Platform)": Math.round(row.platform_target),
      "ผลงาน Platform": row.platform_result,
      "ร้อยละ (Platform)": parseFloat(row.platform_percent.toFixed(2)),
      "มาตามนัด (2) (HIS)": row.visit_type_2,
      "รับส่งต่อ (3) (HIS)": row.visit_type_3,
      "Tele (5) (HIS)": row.visit_type_5,
      "รวม 2+3+5 (HIS)": row.total,
      "ร้อยละ (HIS)": parseFloat(row.percent.toFixed(2)),
      "OPD (2,3,5) (HDC)": row.hdc_opd,
      "Tele (5) (HDC)": row.hdc_result,
      "ร้อยละ (HDC)": parseFloat(row.hdc_percent.toFixed(2)),
      "HDC - PLATFORM": row.hdc_result - row.platform_result,
      "HDC - HIS": row.hdc_result - row.visit_type_5
    }));

    // Add Totals Row
    const totals = data.reduce((acc, curr) => ({
      platform_target: acc.platform_target + curr.platform_target,
      platform_result: acc.platform_result + curr.platform_result,
      visit_type_2: acc.visit_type_2 + curr.visit_type_2,
      visit_type_3: acc.visit_type_3 + curr.visit_type_3,
      visit_type_5: acc.visit_type_5 + curr.visit_type_5,
      total: acc.total + curr.total,
      hdc_opd: acc.hdc_opd + curr.hdc_opd,
      hdc_result: acc.hdc_result + curr.hdc_result,
    }), {
      platform_target: 0,
      platform_result: 0,
      visit_type_2: 0,
      visit_type_3: 0,
      visit_type_5: 0,
      total: 0,
      hdc_opd: 0,
      hdc_result: 0
    });

    const totalPercentPlatform = totals.platform_target > 0 ? (totals.platform_result / totals.platform_target * 100) : 0;
    const totalPercentHIS = totals.total > 0 ? (totals.visit_type_5 / totals.total * 100) : 0;
    const totalPercentHDC = totals.hdc_opd > 0 ? (totals.hdc_result / totals.hdc_opd * 100) : 0;

    exportRows.push({
      "ลำดับ": null as any,
      "รหัส": "",
      "ชื่อหน่วยบริการ": "รวมทั้งหมด",
      "สังกัด": "",
      "ประเภท": "",
      "เป้าหมาย (Platform)": Math.round(totals.platform_target),
      "ผลงาน Platform": totals.platform_result,
      "ร้อยละ (Platform)": parseFloat(totalPercentPlatform.toFixed(2)),
      "มาตามนัด (2) (HIS)": totals.visit_type_2,
      "รับส่งต่อ (3) (HIS)": totals.visit_type_3,
      "Tele (5) (HIS)": totals.visit_type_5,
      "รวม 2+3+5 (HIS)": totals.total,
      "ร้อยละ (HIS)": parseFloat(totalPercentHIS.toFixed(2)),
      "OPD (2,3,5) (HDC)": totals.hdc_opd,
      "Tele (5) (HDC)": totals.hdc_result,
      "ร้อยละ (HDC)": parseFloat(totalPercentHDC.toFixed(2)),
      "HDC - PLATFORM": totals.hdc_result - totals.platform_result,
      "HDC - HIS": totals.hdc_result - totals.visit_type_5
    });

    const policyLabel = policy === "pheoc" ? "PHEOC" : "TMM";
    const ws = XLSX.utils.json_to_sheet(exportRows);
    const wb = XLSX.utils.book_new();
    
    const isPrimary = view === "primary";
    const sheetName = isPrimary ? `Daily_Primary_${policyLabel}` : `Daily_Hospitals_${policyLabel}`;
    XLSX.utils.book_append_sheet(wb, ws, sheetName);

    const now = new Date();
    const dateStr = now.toISOString().split('T')[0];
    const timeStr = now.getHours().toString().padStart(2, '0') + 
                   now.getMinutes().toString().padStart(2, '0');
    
    const fileName = isPrimary 
      ? `Daily_Telemedicine_Primary_All_${policyLabel}_${dateStr}_${timeStr}.xlsx`
      : `Daily_Telemedicine_Hospitals_All_${policyLabel}_${dateStr}_${timeStr}.xlsx`;
    
    XLSX.writeFile(wb, fileName);
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

export default ExportDailyHospitalsExcel;
