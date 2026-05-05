"use client";

import React from 'react';
import { utils, writeFileXLSX } from 'xlsx';

interface DailyHospitalRow {
  hospcode: string;
  hospname: string;
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
}

interface ExportDailyHospitalProps {
  rows: DailyHospitalRow[];
  districtName: string;
}

export default function ExportDailyHospital({ rows, districtName }: ExportDailyHospitalProps) {
  const handleExportExcel = () => {
    const exportRows = rows.map((row, index) => ({
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
      "ผลต่าง (HDC-HIS)": row.hdc_result - row.total,
      "อำเภอ": row.amp_name
    }));

    // Add Totals Row
    const totals = rows.reduce((acc, curr) => ({
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
      "ผลต่าง (HDC-HIS)": totals.hdc_result - totals.total,
      "อำเภอ": ""
    });

    const ws = utils.json_to_sheet(exportRows);
    const wb = utils.book_new();
    utils.book_append_sheet(wb, ws, "Daily_Hospital");

    const now = new Date();
    const dateStr = now.toISOString().split('T')[0];
    const timeStr = now.getHours().toString().padStart(2, '0') + 
                   now.getMinutes().toString().padStart(2, '0');
    
    writeFileXLSX(wb, `Daily_Telemedicine_อ_${districtName}_${dateStr}_${timeStr}.xlsx`);
  };

  return (
    <button
      onClick={handleExportExcel}
      className="flex items-center gap-1.5 px-3 py-1 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 rounded-full transition-all duration-200 group text-emerald-700 hover:text-emerald-800 leading-none shadow-sm"
    >
      <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5 text-emerald-600 group-hover:scale-110 transition-transform" fill="currentColor" viewBox="0 0 24 24">
        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8l-6-6zm-1.5 16.5L10 16l-2.5 2.5H6l3.5-3.5L6 11.5h1.5l2 2.5 2-2.5H13l-3.5 3.5 3.5 3.5h-1.5zM13 9V3.5L18.5 9H13z" />
      </svg>
      <span className="font-bold text-[10px] uppercase tracking-wider">Export Excel</span>
    </button>
  );
}
