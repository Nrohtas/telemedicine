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
      "เป้าหมาย (1)": Math.round(row.platform_target),
      "ผลงานแพลตฟอร์ม (1)": row.platform_result,
      "ร้อยละ (1)": row.platform_percent.toFixed(2),
      "มาตามนัด (2)": row.visit_type_2,
      "รับส่งต่อ (3)": row.visit_type_3,
      "แพทย์ทางไกล (5)": row.visit_type_5,
      "รวม 2+3+5": row.total,
      "ร้อยละ (5/รวม)": row.percent.toFixed(2),
      "ผลต่าง (HIS-Platform)": row.diff_platform_his,
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
      diff_platform_his: acc.diff_platform_his + curr.diff_platform_his,
    }), {
      platform_target: 0,
      platform_result: 0,
      visit_type_2: 0,
      visit_type_3: 0,
      visit_type_5: 0,
      total: 0,
      diff_platform_his: 0
    });

    const totalPercentPlatform = totals.platform_target > 0 ? (totals.platform_result / totals.platform_target * 100) : 0;
    const totalPercentHIS = totals.total > 0 ? (totals.visit_type_5 / totals.total * 100) : 0;

    exportRows.push({
      "ลำดับ": null as any,
      "รหัส": "",
      "ชื่อหน่วยบริการ": "รวมทั้งหมด",
      "สังกัด": "",
      "ประเภท": "",
      "เป้าหมาย (1)": Math.round(totals.platform_target),
      "ผลงานแพลตฟอร์ม (1)": totals.platform_result,
      "ร้อยละ (1)": totalPercentPlatform.toFixed(2),
      "มาตามนัด (2)": totals.visit_type_2,
      "รับส่งต่อ (3)": totals.visit_type_3,
      "แพทย์ทางไกล (5)": totals.visit_type_5,
      "รวม 2+3+5": totals.total,
      "ร้อยละ (5/รวม)": totalPercentHIS.toFixed(2),
      "ผลต่าง (HIS-Platform)": totals.diff_platform_his,
      "อำเภอ": ""
    });

    const ws = utils.json_to_sheet(exportRows);
    const wb = utils.book_new();
    utils.book_append_sheet(wb, ws, "Daily_Hospital");

    const now = new Date();
    const dateStr = now.toISOString().split('T')[0];
    const timeStr = now.toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false }).replace(/:/g, '-');
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
