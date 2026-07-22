"use client";

import React, { useEffect, useState, Suspense, useCallback } from 'react';
import { useSearchParams } from 'next/navigation';
import { utils, writeFileXLSX } from 'xlsx';
import Navbar from "@/components/Navbar";
import SoftSelect from '@/components/ui/SoftSelect';
import Footer from '@/components/Footer';
import LastUpdate from '@/components/LastUpdate';

interface Hospital {
    hospcode: string;
    hospname: string;
    hostype: string;
    amp_code: string;
    amp_name: string;
    tmb_name: string;
    hostype_name: string;
    hostype_level: string;
    moph: number;
    buddycare: number;
    hdc: number;
    healthconnex: number;
    result: number;
    moph_past: number;
    buddycare_past: number;
    hdc_past: number;
    healthconnex_past: number;
    result_past: number;
    moph_date?: string;
    moph_past_date?: string;
    buddycare_date?: string;
    buddycare_past_date?: string;
    hdc_date?: string;
    hdc_past_date?: string;
    healthconnex_date?: string;
    healthconnex_past_date?: string;
    result_date?: string;
    result_past_date?: string;
    op: number;
    op_30: number;
}

interface DistrictGroup {
    amp_name: string;
    amp_code: string;
    hospitals: Hospital[];
}

const formatPercent = (val: number) => {
    const num = Number(val);
    if (isNaN(num)) return "0%";
    return new Intl.NumberFormat("th-TH", {
        minimumFractionDigits: 0,
        maximumFractionDigits: 2,
    }).format(num) + "%";
};

export default function HospitalDirectory() {
    return (
        <Suspense fallback={
            <div className="flex justify-center items-center py-20">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-nm-primary"></div>
            </div>
        }>
            <HospitalDirectoryContent />
        </Suspense>
    );
}

function HospitalDirectoryContent() {
    const searchParams = useSearchParams();
    const [data, setData] = useState<DistrictGroup[]>([]);
    const [loading, setLoading] = useState(true);
    const [affiliations, setAffiliations] = useState<string[]>([]);

    // Filter State
    const [selectedAffiliation, setSelectedAffiliation] = useState("ทั้งหมด");
    const [selectedType, setSelectedType] = useState(() => {
        return searchParams.get('type') || "ทั้งหมด";
    });
    const [selectedDistrict, setSelectedDistrict] = useState(() => {
        return searchParams.get('amp_code') || "เลือกอำเภอ";
    });
    const [selectedStation, setSelectedStation] = useState("ทั้งหมด");
    const [searchTerm, setSearchTerm] = useState("");
    const [selectedSort, setSelectedSort] = useState("percent");

    useEffect(() => {
        fetch('/telemedicine/api/affiliations')
            .then(res => res.json())
            .then(data => setAffiliations(data))
            .catch(err => console.error('Failed to fetch affiliations:', err));
    }, []);

    useEffect(() => {
        if (selectedDistrict === "เลือกอำเภอ") {
            setData([]);
            setLoading(false);
            return;
        }

        setLoading(true);
        const params = new URLSearchParams();
        if (selectedAffiliation !== "ทั้งหมด") params.append('affiliation', selectedAffiliation);
        if (selectedType !== "ทั้งหมด") params.append('type', selectedType);
        if (selectedDistrict !== "ทั้งหมด") params.append('amp_code', selectedDistrict);
        if (selectedStation !== "ทั้งหมด") params.append('hospcode', selectedStation);

        const url = `/telemedicine/api/hospital-directory?${params.toString()}`;

        fetch(url)
            .then(res => res.json())
            .then(data => {
                if (Array.isArray(data)) {
                    setData(data);
                } else {
                    console.error('API returned non-array data:', data);
                    setData([]);
                }
                setLoading(false);
            })
            .catch(err => {
                console.error(err);
                setLoading(false);
            });
    }, [selectedAffiliation, selectedType, selectedDistrict, selectedStation]);

    const filteredData = data.map(group => ({
        ...group,
        hospitals: group.hospitals.filter(h =>
            h.hospname.toLowerCase().includes(searchTerm.toLowerCase()) ||
            h.hospcode.includes(searchTerm)
        )
    })).filter(group => group.hospitals.length > 0);

    const handleExportExcel = useCallback(() => {
        const exportRows: any[] = [];
        let index = 1;

        const sortHospitals = (hospitals: Hospital[]) => {
            return [...hospitals].sort((a, b) => {
                if (selectedSort === 'hospcode') return a.hospcode.localeCompare(b.hospcode);
                if (selectedSort === 'target') return (b.op || 0) - (a.op || 0);
                if (selectedSort === 'total') return (b.result || 0) - (a.result || 0);
                if (selectedSort === 'gap') return ((b.op || 0) - (b.result || 0)) - ((a.op || 0) - (a.result || 0));

                // Default: percent
                const getPercent = (h: any) => h.op > 0 ? ((h.result || 0) / h.op * 100) : 0;
                return getPercent(b) - getPercent(a);
            });
        };

        if (selectedDistrict === 'ทั้งหมด') {
            const allHospitals = filteredData.flatMap(group => group.hospitals);
            const sortedHospitals = sortHospitals(allHospitals);

            sortedHospitals.forEach(h => {
                const typeLabel = h.hostype_level || (h.hostype === '05' ? 'รพ.' : h.hostype === '06' ? 'รพท.' : h.hostype === '07' ? 'รพศ.' : 'รพ.สต.');
                exportRows.push({
                    "ลำดับ": index++,
                    "รหัส": h.hospcode,
                    "ชื่อหน่วยบริการ": h.hospname,
                    "เป้าหมาย 100%": h.op || 0,
                    "เป้าหมาย 30%": h.op_30 || 0,
                    "หมอพร้อม": h.moph,
                    "สอน.บัดดี้": h.buddycare,
                    "HDC": h.hdc || 0,
                    "Health Connex": h.healthconnex || 0,
                    "ยอดรวม": h.result || 0,
                    "เปอร์เซ็นต์ (100%)": h.op > 0 ? formatPercent((h.result || 0) / h.op * 100) : "0%",
                    "เปอร์เซ็นต์ (30%)": h.op_30 > 0 ? formatPercent((h.result || 0) / h.op_30 * 100) : "0%",
                    "ขาดอีก (100%)": h.op > 0 ? Math.max(0, h.op - (h.result || 0)) : 0,
                    "ขาดอีก (30%)": h.op_30 > 0 ? Math.max(0, h.op_30 - (h.result || 0)) : 0,
                    "ตำบล": h.tmb_name || '-',
                    "อำเภอ": h.amp_name,
                    "ประเภท": typeLabel
                });
            });
        } else {
            filteredData.forEach(group => {
                const sortedHospitals = sortHospitals(group.hospitals);
                // Add Hospital Rows
                sortedHospitals.forEach(h => {
                    const typeLabel = h.hostype_level || (h.hostype === '05' ? 'รพ.' : h.hostype === '06' ? 'รพท.' : h.hostype === '07' ? 'รพศ.' : 'รพ.สต.');
                    exportRows.push({
                        "ลำดับ": index++,
                        "รหัส": h.hospcode,
                        "ชื่อหน่วยบริการ": h.hospname,
                        "เป้าหมาย 100%": h.op || 0,
                        "เป้าหมาย 30%": h.op_30 || 0,
                        "หมอพร้อม": h.moph,
                        "สอน.บัดดี้": h.buddycare,
                        "HDC": h.hdc || 0,
                        "Health Connex": h.healthconnex || 0,
                        "ยอดรวม": h.result || 0,
                        "เปอร์เซ็นต์ (100%)": h.op > 0 ? formatPercent((h.result || 0) / h.op * 100) : "0%",
                        "เปอร์เซ็นต์ (30%)": h.op_30 > 0 ? formatPercent((h.result || 0) / h.op_30 * 100) : "0%",
                        "ขาดอีก (100%)": h.op > 0 ? Math.max(0, h.op - (h.result || 0)) : 0,
                        "ขาดอีก (30%)": h.op_30 > 0 ? Math.max(0, h.op_30 - (h.result || 0)) : 0,
                        "ตำบล": h.tmb_name || '-',
                        "อำเภอ": h.amp_name,
                        "ประเภท": typeLabel
                    });
                });

                // Add District Summary Row
                const districtMoph = group.hospitals.reduce((sum, h) => sum + h.moph, 0);
                const districtBuddy = group.hospitals.reduce((sum, h) => sum + h.buddycare, 0);
                const districtHdc = group.hospitals.reduce((sum, h) => sum + (h.hdc || 0), 0);
                const districtHealthConnex = group.hospitals.reduce((sum, h) => sum + (h.healthconnex || 0), 0);
                const districtResult = group.hospitals.reduce((sum, h) => sum + (h.result || 0), 0);
                const districtTarget100 = group.hospitals.reduce((sum, h) => sum + (h.op || 0), 0);
                const districtTarget30 = group.hospitals.reduce((sum, h) => sum + h.op_30, 0);

                exportRows.push({
                    "ลำดับ": "",
                    "รหัส": "",
                    "ชื่อหน่วยบริการ": `รวมอำเภอ${group.amp_name}`,
                    "เป้าหมาย 100%": districtTarget100,
                    "เป้าหมาย 30%": districtTarget30,
                    "หมอพร้อม": districtMoph,
                    "สอน.บัดดี้": districtBuddy,
                    "HDC": districtHdc,
                    "Health Connex": districtHealthConnex,
                    "ยอดรวม": districtResult,
                    "เปอร์เซ็นต์ (100%)": districtTarget100 > 0 ? formatPercent(districtResult / districtTarget100 * 100) : "0%",
                    "เปอร์เซ็นต์ (30%)": districtTarget30 > 0 ? formatPercent(districtResult / districtTarget30 * 100) : "0%",
                    "ขาดอีก (100%)": districtTarget100 > 0 ? Math.max(0, districtTarget100 - districtResult) : 0,
                    "ขาดอีก (30%)": districtTarget30 > 0 ? Math.max(0, districtTarget30 - districtResult) : 0,
                    "ตำบล": "",
                    "อำเภอ": "",
                    "ประเภท": ""
                });
            });
        }

        // Add Grand Total Row if multiple districts
        if (selectedDistrict === 'ทั้งหมด' || filteredData.length > 1) {
            const grandMoph = filteredData.reduce((total, group) => total + group.hospitals.reduce((sum, h) => sum + h.moph, 0), 0);
            const grandBuddy = filteredData.reduce((total, group) => total + group.hospitals.reduce((sum, h) => sum + h.buddycare, 0), 0);
            const grandHdc = filteredData.reduce((total, group) => total + group.hospitals.reduce((sum, h) => sum + (h.hdc || 0), 0), 0);
            const grandHealthConnex = filteredData.reduce((total, group) => total + group.hospitals.reduce((sum, h) => sum + (h.healthconnex || 0), 0), 0);
            const grandResult = filteredData.reduce((total, group) => total + group.hospitals.reduce((sum, h) => sum + (h.result || 0), 0), 0);
            const grandTarget100 = filteredData.reduce((total, group) => total + group.hospitals.reduce((sum, h) => sum + (h.op || 0), 0), 0);
            const grandTarget30 = filteredData.reduce((total, group) => total + group.hospitals.reduce((sum, h) => sum + h.op_30, 0), 0);

            exportRows.push({
                "ลำดับ": "",
                "รหัส": "",
                "ชื่อหน่วยบริการ": "รวมทั้งจังหวัด",
                "เป้าหมาย 100%": grandTarget100,
                "เป้าหมาย 30%": grandTarget30,
                "หมอพร้อม": grandMoph,
                "สอน.บัดดี้": grandBuddy,
                "HDC": grandHdc,
                "Health Connex": grandHealthConnex,
                "ยอดรวม": grandResult,
                "เปอร์เซ็นต์ (100%)": grandTarget100 > 0 ? formatPercent(grandResult / grandTarget100 * 100) : "0%",
                "เปอร์เซ็นต์ (30%)": grandTarget30 > 0 ? formatPercent(grandResult / grandTarget30 * 100) : "0%",
                "ขาดอีก (100%)": grandTarget100 > 0 ? Math.max(0, grandTarget100 - grandResult) : 0,
                "ขาดอีก (30%)": grandTarget30 > 0 ? Math.max(0, grandTarget30 - grandResult) : 0,
                "ตำบล": "",
                "อำเภอ": "",
                "ประเภท": ""
            });
        }

        if (exportRows.length === 0) {
            alert("ไม่พบข้อมูลที่จะส่งออก");
            return;
        }

        const ws = utils.json_to_sheet(exportRows);
        const wb = utils.book_new();
        utils.book_append_sheet(wb, ws, "รายชื่อหน่วยบริการ");

        // Set column widths
        const wscols = [
            { wch: 8 },  // ลำดับ
            { wch: 10 }, // รหัส
            { wch: 40 }, // ชื่อหน่วยบริการ
            { wch: 15 }, // เป้าหมาย 100%
            { wch: 15 }, // เป้าหมาย 30%
            { wch: 12 }, // หมอพร้อม
            { wch: 12 }, // สอน.บัดดี้
            { wch: 12 }, // HDC
            { wch: 15 }, // Health Connex
            { wch: 12 }, // ยอดรวม
            { wch: 16 }, // เปอร์เซ็นต์ (100%)
            { wch: 16 }, // เปอร์เซ็นต์ (30%)
            { wch: 15 }, // ขาดอีก (100%)
            { wch: 15 }, // ขาดอีก (30%)
            { wch: 15 }, // ตำบล
            { wch: 15 }, // อำเภอ
            { wch: 15 }, // ประเภท
        ];
        ws['!cols'] = wscols;

        const now = new Date();
        const dateStr = now.getFullYear().toString() +
            (now.getMonth() + 1).toString().padStart(2, '0') +
            now.getDate().toString().padStart(2, '0');
        const timeStr = now.getHours().toString().padStart(2, '0') +
            now.getMinutes().toString().padStart(2, '0') +
            now.getSeconds().toString().padStart(2, '0');

        let fileNameDistrict = "hospital";
        if (selectedDistrict === 'ทั้งหมด') {
            fileNameDistrict = "ทั้งจังหวัด";
        } else if (filteredData.length > 0) {
            fileNameDistrict = filteredData[0].amp_name;
        }

        writeFileXLSX(wb, `Telemedicine_${fileNameDistrict}_${dateStr}_${timeStr}.xlsx`);
    }, [filteredData, selectedDistrict]);

    const getRowColor = (hostypeName: string) => {
        if (hostypeName === 'กระทรวงสาธารณสุข') return 'text-green-600';
        if (hostypeName === 'องค์กรปกครองส่วนท้องถิ่น') return 'text-purple-600';
        return 'text-black';
    };

    const getHostColor = (label: string) => {
        const text = label || '';
        if (text.includes('รพ.สต.')) return 'text-blue-600';
        if (text.includes('รพศ.')) return 'text-pink-500';
        if (text === 'รพ.' || text === 'รพช.' || text.includes('รพช.')) return 'text-orange-500';
        if (text.includes('ศูนย์สุขภาพ')) return 'text-indigo-900';
        if (text.includes('นอกสังกัด')) return 'text-black';
        return 'text-slate-500';
    };

    const formatThaiDate = (dateStr: string | null | undefined) => {
        if (!dateStr) return '';
        try {
            const date = new Date(dateStr);
            if (isNaN(date.getTime())) return '';
            const day = date.getDate();
            const monthShort = date.toLocaleDateString('th-TH', { month: 'short' });
            const yearThaiShort = (date.getFullYear() + 543).toString().slice(-2);
            return `${day} ${monthShort} ${yearThaiShort}`;
        } catch {
            return '';
        }
    };

    const renderComparisonCell = (current: number, past: number, textClass: string) => {
        const diff = current - past;
        return (
            <div className="flex flex-col items-end gap-0.5">
                <div className="flex items-center gap-1.5">
                    {diff > 0 && (
                        <span className="text-[10px] font-bold px-1 rounded-sm bg-emerald-50 text-emerald-600">
                            +{diff.toLocaleString()}
                        </span>
                    )}
                    {diff < 0 && (
                        <span className="text-[10px] font-bold px-1 rounded-sm bg-red-50 text-red-600">
                            {diff.toLocaleString()}
                        </span>
                    )}
                    <span className={textClass}>{current.toLocaleString()}</span>
                </div>
                <span className="text-[10px] text-gray-400 font-medium whitespace-nowrap opacity-60">({past.toLocaleString()})</span>
            </div>
        );
    };

    // Helper to get dates for header
    const mophDate = data.flatMap(g => g.hospitals).find(h => h.moph_date)?.moph_date;
    const mophPastDate = data.flatMap(g => g.hospitals).find(h => h.moph_past_date)?.moph_past_date;
    const buddyDate = data.flatMap(g => g.hospitals).find(h => h.buddycare_date)?.buddycare_date;
    const buddyPastDate = data.flatMap(g => g.hospitals).find(h => h.buddycare_past_date)?.buddycare_past_date;
    const hdcDate = data.flatMap(g => g.hospitals).find(h => h.hdc_date)?.hdc_date;
    const hdcPastDate = data.flatMap(g => g.hospitals).find(h => h.hdc_past_date)?.hdc_past_date;
    const healthconnexDate = data.flatMap(g => g.hospitals).find(h => h.healthconnex_date)?.healthconnex_date;
    const healthconnexPastDate = data.flatMap(g => g.hospitals).find(h => h.healthconnex_past_date)?.healthconnex_past_date;

    const renderHeaderDate = (current?: string, past?: string) => {
        if (!current && !past) return null;
        return (
            <div className="flex flex-col text-[8px] opacity-70 font-medium leading-none mt-1 space-y-0.5">
                {current && <span className="whitespace-nowrap text-emerald-700/80">ล่าสุด: {formatThaiDate(current)}</span>}
                {past && <span className="whitespace-nowrap text-slate-400">ครั้งก่อน: {formatThaiDate(past)}</span>}
            </div>
        );
    };

    return (
        <main className="min-h-screen flex flex-col bg-background">
            <Navbar
                selectedAffiliation={selectedAffiliation}
                onAffiliationChange={setSelectedAffiliation}
                selectedType={selectedType}
                onTypeChange={setSelectedType}
                selectedDistrict={selectedDistrict}
                onDistrictChange={setSelectedDistrict}
                selectedStation={selectedStation}
                onStationChange={setSelectedStation}
                showAllDistrict={true}
                searchValue={searchTerm}
                onSearchChange={setSearchTerm}
                selectedSort={selectedSort}
                onSortChange={setSelectedSort}
            />


            <div className="px-6 max-w-7xl mx-auto mt-4">
                {/* Search Bar */}


                {loading ? (
                    <div className="flex justify-center items-center py-20">
                        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-nm-primary"></div>
                    </div>
                ) : selectedDistrict === "เลือกอำเภอ" ? (
                    <div className="flex flex-col items-center justify-center py-32 text-center opacity-40">
                        <div className="w-24 h-24 mb-6 rounded-full bg-nm-primary/10 flex items-center justify-center">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 text-nm-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                            </svg>
                        </div>
                        <h3 className="text-xl font-bold mb-2">กรุณาเลือกอำเภอ</h3>
                        <p className="text-sm">ระบุอำเภอที่ด้านบนเพื่อแสดงข้อมูลหน่วยบริการ</p>
                    </div>
                ) : (
                    <div className="space-y-12">
                        {selectedDistrict === 'ทั้งหมด' ? (
                            /* Unified Province-Wide Table */
                            <div className="space-y-4">
                                <div className="flex items-center gap-2 px-2">
                                    <div className="w-8 h-8 rounded-lg bg-indigo-50 flex items-center justify-center text-indigo-600 shadow-sm border border-indigo-100">
                                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                        </svg>
                                    </div>
                                    <h3 className="text-lg font-bold text-nm-primary opacity-80">สรุปข้อมูลทั้งจังหวัด</h3>
                                    <div className="h-px flex-1 bg-gradient-to-r from-nm-primary/20 to-transparent"></div>
                                    <LastUpdate className="mb-0 flex-shrink-0" />
                                    <button
                                        onClick={handleExportExcel}
                                        className="flex items-center gap-1.5 px-3 py-1 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 rounded-full transition-all duration-200 group text-emerald-700 hover:text-emerald-800 leading-none shadow-sm"
                                    >
                                        <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5 text-emerald-600 group-hover:scale-110 transition-transform" fill="currentColor" viewBox="0 0 24 24">
                                            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8l-6-6zm-1.5 16.5L10 16l-2.5 2.5H6l3.5-3.5L6 11.5h1.5l2 2.5 2-2.5H13l-3.5 3.5 3.5 3.5h-1.5zM13 9V3.5L18.5 9H13z" />
                                        </svg>
                                        <span className="font-bold text-[10px] uppercase tracking-wider">Export Excel</span>
                                    </button>
                                </div>

                                <div className="bg-white/50 backdrop-blur-sm border border-white/60 rounded-xl shadow-sm overflow-hidden">
                                    <div className="overflow-x-auto overflow-y-auto max-h-[70vh] custom-scrollbar">
                                        <table className="w-full text-left border-collapse min-w-[800px]">
                                            <thead className="sticky top-0 z-20 bg-[#FDFBFF] shadow-sm">
                                                <tr className="bg-nm-primary/5 text-nm-primary text-xs uppercase tracking-wider font-bold border-b border-nm-primary/10">
                                                    <th className="px-6 py-4 w-24 sticky left-0 z-10 bg-[#FDFBFF]/95 backdrop-blur-sm shadow-[inset_-1px_0_0_0_rgba(0,0,0,0.05)]">รหัส</th>
                                                    <th className="px-6 py-4 whitespace-nowrap">ชื่อหน่วยบริการ</th>
                                                    <th className="px-6 py-4 w-32 text-right text-red-700 whitespace-nowrap">เป้าหมาย 100%</th>
                                                    <th className="px-6 py-4 w-32 text-right text-red-600 whitespace-nowrap">เป้าหมาย 30%</th>
                                                    <th className="px-6 py-4 w-28 text-right text-[#006837] whitespace-nowrap">
                                                        หมอพร้อม
                                                        {renderHeaderDate(mophDate, mophPastDate)}
                                                    </th>
                                                    <th className="px-6 py-4 w-28 text-right text-[#00ADEF] whitespace-nowrap">
                                                        สอน.บัดดี้
                                                        {renderHeaderDate(buddyDate, buddyPastDate)}
                                                    </th>
                                                    <th className="px-6 py-4 w-28 text-right text-[#7C3AED] whitespace-nowrap">
                                                        HDC
                                                        {renderHeaderDate(hdcDate, hdcPastDate)}
                                                    </th>
                                                    <th className="px-6 py-4 w-28 text-right text-[#FF6B6B] whitespace-nowrap">
                                                        Health Connex
                                                        {renderHeaderDate(healthconnexDate, healthconnexPastDate)}
                                                    </th>
                                                    <th className="px-6 py-4 w-32 text-right text-indigo-700 whitespace-nowrap">
                                                        ยอดรวม
                                                    </th>
                                                    <th className="px-6 py-4 w-32 text-right text-emerald-700 whitespace-nowrap">% (100%)</th>
                                                    <th className="px-6 py-4 w-32 text-right text-emerald-600 whitespace-nowrap">% (30%)</th>
                                                    <th className="px-6 py-4 w-32 text-right text-[#FF6B6B] whitespace-nowrap">ขาดอีก (100%)</th>
                                                    <th className="px-6 py-4 w-32 text-right text-rose-500 whitespace-nowrap">ขาดอีก (30%)</th>
                                                    <th className="px-6 py-4 w-40 whitespace-nowrap">ตำบล</th>
                                                    <th className="px-6 py-4 w-32 whitespace-nowrap">อำเภอ</th>
                                                    <th className="px-6 py-4 w-32 whitespace-nowrap">ประเภท</th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-gray-100">
                                                {filteredData
                                                    .flatMap(group => group.hospitals)
                                                    .sort((a, b) => {
                                                        if (selectedSort === 'hospcode') return a.hospcode.localeCompare(b.hospcode);
                                                        if (selectedSort === 'target') return (b.op || 0) - (a.op || 0);
                                                        if (selectedSort === 'total') return (b.result || 0) - (a.result || 0);
                                                        if (selectedSort === 'gap') return ((b.op || 0) - (b.result || 0)) - ((a.op || 0) - (a.result || 0));

                                                        // Default: percent
                                                        const getPercent = (h: any) => h.op > 0 ? ((h.result || 0) / h.op * 100) : 0;
                                                        return getPercent(b) - getPercent(a);
                                                    })
                                                    .map((hospital) => {
                                                        const rowColor = getRowColor(hospital.hostype_name);
                                                        return (
                                                            <tr key={hospital.hospcode} className="transition-colors duration-200">
                                                                <td className={`px-6 py-3 font-mono text-sm opacity-70 font-bold ${rowColor} sticky left-0 z-10 bg-white/95 backdrop-blur-sm shadow-[inset_-1px_0_0_0_rgba(0,0,0,0.03)]`}>
                                                                    {hospital.hospcode}
                                                                </td>
                                                                <td className="px-6 py-3">
                                                                    <span className={`text-sm font-bold transition-colors whitespace-nowrap ${rowColor}`}>
                                                                        {hospital.hospname}
                                                                    </span>
                                                                </td>

                                                                <td className="px-6 py-3 text-right">
                                                                    <span className="text-sm font-bold text-red-700">{(hospital.op || 0).toLocaleString()}</span>
                                                                </td>
                                                                <td className="px-6 py-3 text-right">
                                                                    <span className="text-sm font-bold text-red-600">{(hospital.op_30 || 0).toLocaleString()}</span>
                                                                </td>
                                                                <td className="px-6 py-3">
                                                                    {renderComparisonCell(hospital.moph, hospital.moph_past, "text-sm font-bold text-[#006837]")}
                                                                </td>
                                                                <td className="px-6 py-3">
                                                                    {renderComparisonCell(hospital.buddycare, hospital.buddycare_past, "text-sm font-bold text-[#00ADEF]")}
                                                                </td>
                                                                <td className="px-6 py-3">
                                                                    {renderComparisonCell(hospital.hdc || 0, hospital.hdc_past || 0, "text-sm font-bold text-[#7C3AED]")}
                                                                </td>
                                                                <td className="px-6 py-3">
                                                                    {renderComparisonCell(hospital.healthconnex || 0, hospital.healthconnex_past || 0, "text-sm font-bold text-[#FF6B6B]")}
                                                                </td>
                                                                <td className="px-6 py-3 bg-indigo-50/30">
                                                                    {renderComparisonCell(hospital.result || 0, hospital.result_past || 0, "text-sm font-black text-indigo-700")}
                                                                </td>
                                                                <td className="px-6 py-3 text-right bg-emerald-50/40">
                                                                    <span className="text-sm font-bold text-emerald-700">
                                                                        {formatPercent(hospital.op > 0 ? ((hospital.result || 0) / hospital.op * 100) : 0)}
                                                                    </span>
                                                                </td>
                                                                <td className="px-6 py-3 text-right bg-emerald-50/20">
                                                                    <span className="text-sm font-bold text-emerald-600">
                                                                        {formatPercent(hospital.op_30 > 0 ? ((hospital.result || 0) / hospital.op_30 * 100) : 0)}
                                                                    </span>
                                                                </td>
                                                                <td className="px-6 py-3 text-right bg-red-50/40">
                                                                    <span className="text-sm font-bold text-[#FF6B6B]">
                                                                        {(hospital.op > 0 ? Math.max(0, hospital.op - (hospital.result || 0)) : 0).toLocaleString()}
                                                                    </span>
                                                                </td>
                                                                <td className="px-6 py-3 text-right bg-red-50/20">
                                                                    <span className="text-sm font-bold text-rose-500">
                                                                        {(hospital.op_30 > 0 ? Math.max(0, hospital.op_30 - (hospital.result || 0)) : 0).toLocaleString()}
                                                                    </span>
                                                                </td>
                                                                <td className="px-6 py-3 text-sm opacity-70 whitespace-nowrap">
                                                                    ต.{hospital.tmb_name || '-'}
                                                                </td>
                                                                <td className="px-6 py-3 text-sm opacity-70 font-bold whitespace-nowrap">
                                                                    อ.{hospital.amp_name}
                                                                </td>
                                                                <td className="px-6 py-3 whitespace-nowrap">
                                                                    {(() => {
                                                                        const label = hospital.hostype_level || (hospital.hostype === '05' ? 'รพศ.' : hospital.hostype === '06' ? 'รพท.' : hospital.hostype === '07' ? 'รพช.' : 'รพ.สต.');
                                                                        const colorClass = getHostColor(label);
                                                                        return (
                                                                            <span className={`text-xs font-bold whitespace-nowrap ${colorClass}`}>
                                                                                {label}
                                                                            </span>
                                                                        );
                                                                    })()}
                                                                </td>
                                                            </tr>
                                                        );
                                                    })}
                                                {/* Unified Summary Row */}
                                                <tr className="bg-nm-primary/10 font-bold border-t-2 border-nm-primary/30">
                                                    <td colSpan={2} className="px-6 py-5 text-nm-primary text-right text-base">
                                                        รวมทั้งจังหวัด
                                                    </td>
                                                    <td className="px-6 py-5 text-right font-black text-red-700">
                                                        <span className="text-xl">
                                                            {filteredData.reduce((total, group) => total + group.hospitals.reduce((sum, h) => sum + (h.op || 0), 0), 0).toLocaleString()}
                                                        </span>
                                                    </td>
                                                    <td className="px-6 py-5 text-right font-black text-red-800">
                                                        <span className="text-xl">
                                                            {filteredData.reduce((total, group) => total + group.hospitals.reduce((sum, h) => sum + (h.op_30 || 0), 0), 0).toLocaleString()}
                                                        </span>
                                                    </td>
                                                    <td className="px-6 py-5">
                                                        {renderComparisonCell(
                                                            filteredData.reduce((total, group) => total + group.hospitals.reduce((sum, h) => sum + h.moph, 0), 0),
                                                            filteredData.reduce((total, group) => total + group.hospitals.reduce((sum, h) => sum + h.moph_past, 0), 0),
                                                            "text-xl font-black text-emerald-800"
                                                        )}
                                                    </td>
                                                    <td className="px-6 py-5">
                                                        {renderComparisonCell(
                                                            filteredData.reduce((total, group) => total + group.hospitals.reduce((sum, h) => sum + h.buddycare, 0), 0),
                                                            filteredData.reduce((total, group) => total + group.hospitals.reduce((sum, h) => sum + h.buddycare_past, 0), 0),
                                                            "text-xl font-black text-blue-800"
                                                        )}
                                                    </td>
                                                    <td className="px-6 py-5 bg-indigo-50/50">
                                                        {renderComparisonCell(
                                                            filteredData.reduce((total, group) => total + group.hospitals.reduce((sum, h) => sum + (h.result || 0), 0), 0),
                                                            filteredData.reduce((total, group) => total + group.hospitals.reduce((sum, h) => sum + (h.result_past || 0), 0), 0),
                                                            "text-xl font-black text-indigo-900"
                                                        )}
                                                    </td>
                                                    <td className="px-6 py-5 text-right bg-emerald-50/50">
                                                        <span className="text-xl font-black text-emerald-700">
                                                            {(() => {
                                                                const target = filteredData.reduce((total, group) => total + group.hospitals.reduce((sum, h) => sum + (h.op || 0), 0), 0);
                                                                const current = filteredData.reduce((total, group) => total + group.hospitals.reduce((sum, h) => sum + (h.result || 0), 0), 0);
                                                                return formatPercent(target > 0 ? (current / target * 100) : 0);
                                                            })()}
                                                        </span>
                                                    </td>
                                                    <td className="px-6 py-5 text-right bg-emerald-50/30">
                                                        <span className="text-xl font-black text-emerald-600">
                                                            {(() => {
                                                                const target = filteredData.reduce((total, group) => total + group.hospitals.reduce((sum, h) => sum + (h.op_30 || 0), 0), 0);
                                                                const current = filteredData.reduce((total, group) => total + group.hospitals.reduce((sum, h) => sum + (h.result || 0), 0), 0);
                                                                return formatPercent(target > 0 ? (current / target * 100) : 0);
                                                            })()}
                                                        </span>
                                                    </td>
                                                    <td className="px-6 py-5 text-right bg-red-50/50">
                                                        <span className="text-xl font-black text-red-700">
                                                            {(() => {
                                                                const target = filteredData.reduce((total, group) => total + group.hospitals.reduce((sum, h) => sum + (h.op || 0), 0), 0);
                                                                const current = filteredData.reduce((total, group) => total + group.hospitals.reduce((sum, h) => sum + (h.result || 0), 0), 0);
                                                                return (target > 0 ? Math.max(0, target - current) : 0).toLocaleString();
                                                            })()}
                                                        </span>
                                                    </td>
                                                    <td className="px-6 py-5 text-right bg-red-50/30">
                                                        <span className="text-xl font-black text-rose-600">
                                                            {(() => {
                                                                const target = filteredData.reduce((total, group) => total + group.hospitals.reduce((sum, h) => sum + (h.op_30 || 0), 0), 0);
                                                                const current = filteredData.reduce((total, group) => total + group.hospitals.reduce((sum, h) => sum + (h.result || 0), 0), 0);
                                                                return (target > 0 ? Math.max(0, target - current) : 0).toLocaleString();
                                                            })()}
                                                        </span>
                                                    </td>
                                                </tr>
                                            </tbody>
                                        </table>
                                    </div>
                                </div>
                            </div>
                        ) : (
                            /* Existing District-Grouped Tables */
                            filteredData.map((group, groupIndex) => (
                                <div key={group.amp_code} className="space-y-4">
                                    <div className="flex items-center gap-2 px-2">
                                        <div className="w-8 h-8 rounded-lg bg-slate-50 flex items-center justify-center text-slate-400 border border-slate-100">
                                            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                                            </svg>
                                        </div>
                                                        <h3 className="text-lg font-bold text-nm-primary opacity-80">อำเภอ{group.amp_name}</h3>
                                        <div className="h-px flex-1 bg-gradient-to-r from-nm-primary/20 to-transparent"></div>
                                        {groupIndex === 0 && <LastUpdate className="mb-0 flex-shrink-0" />}
                                        <button
                                            onClick={handleExportExcel}
                                            className="flex items-center gap-1.5 px-3 py-1 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 rounded-full transition-all duration-200 group text-emerald-700 hover:text-emerald-800 leading-none shadow-sm ml-1"
                                        >
                                            <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5 text-emerald-600 group-hover:scale-110 transition-transform" fill="currentColor" viewBox="0 0 24 24">
                                                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8l-6-6zm-1.5 16.5L10 16l-2.5 2.5H6l3.5-3.5L6 11.5h1.5l2 2.5 2-2.5H13l-3.5 3.5 3.5 3.5h-1.5zM13 9V3.5L18.5 9H13z" />
                                            </svg>
                                            <span className="font-bold text-[10px] uppercase tracking-wider">Export Excel</span>
                                        </button>
                                    </div>

                                    <div className="bg-white/50 backdrop-blur-sm border border-white/60 rounded-xl shadow-sm overflow-hidden">
                                        <div className="overflow-x-auto overflow-y-auto max-h-[70vh] custom-scrollbar">
                                            <table className="w-full text-left border-collapse min-w-[800px]">
                                                <thead className="sticky top-0 z-20 bg-[#FDFBFF] shadow-sm">
                                                    <tr className="bg-nm-primary/5 text-nm-primary text-xs uppercase tracking-wider font-bold border-b border-nm-primary/10">
                                                        <th className="px-6 py-4 w-24 sticky left-0 z-10 bg-[#FDFBFF]/95 backdrop-blur-sm shadow-[inset_-1px_0_0_0_rgba(0,0,0,0.05)]">รหัส</th>
                                                        <th className="px-6 py-4 whitespace-nowrap">หน่วยบริการ</th>
                                                        <th className="px-6 py-4 w-32 text-right text-red-700 whitespace-nowrap">เป้าหมาย 100%</th>
                                                        <th className="px-6 py-4 w-32 text-right text-red-600 whitespace-nowrap">เป้าหมาย 30%</th>
                                                        <th className="px-6 py-4 w-28 text-right text-[#006837] whitespace-nowrap">
                                                            หมอพร้อม
                                                            {renderHeaderDate(mophDate, mophPastDate)}
                                                        </th>
                                                        <th className="px-6 py-4 w-28 text-right text-[#00ADEF] whitespace-nowrap">
                                                            สอน.บัดดี้
                                                            {renderHeaderDate(buddyDate, buddyPastDate)}
                                                        </th>
                                                        <th className="px-6 py-4 w-28 text-right text-[#7C3AED] whitespace-nowrap">
                                                            HDC
                                                            {renderHeaderDate(hdcDate, hdcPastDate)}
                                                        </th>
                                                        <th className="px-6 py-4 w-28 text-right text-[#FF6B6B] whitespace-nowrap">
                                                            Health Connex
                                                            {renderHeaderDate(healthconnexDate, healthconnexPastDate)}
                                                        </th>
                                                        <th className="px-6 py-4 w-32 text-right text-indigo-700 whitespace-nowrap">
                                                            ยอดรวม
                                                        </th>
                                                        <th className="px-6 py-4 w-32 text-right text-emerald-700 whitespace-nowrap">% (100%)</th>
                                                        <th className="px-6 py-4 w-32 text-right text-emerald-600 whitespace-nowrap">% (30%)</th>
                                                        <th className="px-6 py-4 w-32 text-right text-[#FF6B6B] whitespace-nowrap">ขาดอีก (100%)</th>
                                                        <th className="px-6 py-4 w-32 text-right text-rose-500 whitespace-nowrap">ขาดอีก (30%)</th>
                                                        <th className="px-6 py-4 w-40 whitespace-nowrap">ตำบล</th>
                                                        <th className="px-6 py-4 w-32 whitespace-nowrap">อำเภอ</th>
                                                        <th className="px-6 py-4 w-32 whitespace-nowrap">ประเภท</th>
                                                    </tr>
                                                </thead>
                                                <tbody className="divide-y divide-gray-100">
                                                    {[...group.hospitals]
                                                        .sort((a, b) => {
                                                            if (selectedSort === 'hospcode') return a.hospcode.localeCompare(b.hospcode);
                                                            if (selectedSort === 'target') return (b.op || 0) - (a.op || 0);
                                                            if (selectedSort === 'total') return (b.result || 0) - (a.result || 0);
                                                            if (selectedSort === 'gap') return ((b.op || 0) - (b.result || 0)) - ((a.op || 0) - (a.result || 0));

                                                            // Default: percent
                                                            const getPercent = (h: any) => h.op > 0 ? ((h.result || 0) / h.op * 100) : 0;
                                                            return getPercent(b) - getPercent(a);
                                                        })
                                                        .map((hospital) => {
                                                            const rowColor = getRowColor(hospital.hostype_name);
                                                            return (
                                                                <tr key={hospital.hospcode} className="transition-colors duration-200">
                                                                    <td className={`px-6 py-3 font-mono text-sm font-black ${rowColor} sticky left-0 z-10 bg-white/95 backdrop-blur-sm shadow-[1px_0_0_0_rgba(0,0,0,0.03)]`}>
                                                                        {hospital.hospcode}
                                                                    </td>
                                                                    <td className="px-6 py-3">
                                                                        <span className={`text-sm font-black transition-colors whitespace-nowrap ${rowColor}`}>
                                                                            {hospital.hospname}
                                                                        </span>
                                                                    </td>
                                                                    <td className="px-6 py-3 text-right">
                                                                        <span className="text-sm font-black text-red-700">{(hospital.op || 0).toLocaleString()}</span>
                                                                    </td>
                                                                    <td className="px-6 py-3 text-right">
                                                                        <span className="text-sm font-black text-red-600">{(hospital.op_30 || 0).toLocaleString()}</span>
                                                                    </td>
                                                                    <td className="px-6 py-3">
                                                                        {renderComparisonCell(hospital.moph, hospital.moph_past, "text-sm font-black text-emerald-800")}
                                                                    </td>
                                                                    <td className="px-6 py-3">
                                                                        {renderComparisonCell(hospital.buddycare, hospital.buddycare_past, "text-sm font-black text-blue-800")}
                                                                    </td>
                                                                    <td className="px-6 py-3">
                                                                        {renderComparisonCell(hospital.hdc || 0, hospital.hdc_past || 0, "text-sm font-black text-purple-800")}
                                                                    </td>
                                                                    <td className="px-6 py-3">
                                                                        {renderComparisonCell(hospital.healthconnex || 0, hospital.healthconnex_past || 0, "text-sm font-black text-rose-800")}
                                                                    </td>
                                                                    <td className="px-6 py-3 bg-indigo-50/30">
                                                                        {renderComparisonCell(hospital.result || 0, hospital.result_past || 0, "text-sm font-black text-indigo-900")}
                                                                    </td>
                                                                    <td className="px-6 py-3 text-right bg-emerald-50/40">
                                                                        <span className="text-sm font-black text-emerald-700">
                                                                            {formatPercent(hospital.op > 0 ? ((hospital.result || 0) / hospital.op * 100) : 0)}
                                                                        </span>
                                                                    </td>
                                                                    <td className="px-6 py-3 text-right bg-emerald-50/20">
                                                                        <span className="text-sm font-black text-emerald-600">
                                                                            {formatPercent(hospital.op_30 > 0 ? ((hospital.result || 0) / hospital.op_30 * 100) : 0)}
                                                                        </span>
                                                                    </td>
                                                                    <td className="px-6 py-3 text-right bg-red-50/40">
                                                                        <span className="text-sm font-bold text-[#FF6B6B]">
                                                                            {(hospital.op > 0 ? Math.max(0, hospital.op - (hospital.result || 0)) : 0).toLocaleString()}
                                                                        </span>
                                                                    </td>
                                                                    <td className="px-6 py-3 text-right bg-red-50/20">
                                                                        <span className="text-sm font-bold text-rose-500">
                                                                            {(hospital.op_30 > 0 ? Math.max(0, hospital.op_30 - (hospital.result || 0)) : 0).toLocaleString()}
                                                                        </span>
                                                                    </td>
                                                                    <td className="px-6 py-3 text-sm font-black text-slate-700 whitespace-nowrap">
                                                                        ต.{hospital.tmb_name || '-'}
                                                                    </td>
                                                                    <td className="px-6 py-3 text-sm font-black text-slate-900 whitespace-nowrap">
                                                                        อ.{hospital.amp_name}
                                                                    </td>
                                                                    <td className="px-6 py-3 whitespace-nowrap">
                                                                        {(() => {
                                                                            const label = hospital.hostype_level || (hospital.hostype === '05' ? 'รพศ.' : hospital.hostype === '06' ? 'รพท.' : hospital.hostype === '07' ? 'รพช.' : 'รพ.สต.');
                                                                            const colorClass = getHostColor(label);
                                                                            return (
                                                                                <span className={`text-xs font-bold whitespace-nowrap ${colorClass}`}>
                                                                                    {label}
                                                                                    </span>
                                                                            );
                                                                        })()}
                                                                    </td>
                                                                </tr>
                                                            );
                                                        })}
                                                    {/* Summary Row */}
                                                    <tr className="bg-nm-primary/5 font-bold border-t-2 border-nm-primary/20">
                                                        <td colSpan={2} className="px-6 py-4 text-nm-primary text-right">
                                                            รวมทั้งหมด
                                                        </td>
                                                        <td className="px-6 py-4 text-right font-black text-red-700">
                                                            <span className="text-base font-bold">
                                                                {group.hospitals.reduce((sum, h) => sum + (h.op || 0), 0).toLocaleString()}
                                                            </span>
                                                        </td>
                                                        <td className="px-6 py-4 text-right font-black text-red-600">
                                                            <span className="text-base font-bold">
                                                                {group.hospitals.reduce((sum, h) => sum + (h.op_30 || 0), 0).toLocaleString()}
                                                            </span>
                                                        </td>
                                                        <td className="px-6 py-4">
                                                            {renderComparisonCell(
                                                                group.hospitals.reduce((sum, h) => sum + h.moph, 0),
                                                                group.hospitals.reduce((sum, h) => sum + h.moph_past, 0),
                                                                "text-base font-bold text-[#006837]"
                                                            )}
                                                        </td>
                                                        <td className="px-6 py-4">
                                                            {renderComparisonCell(
                                                                group.hospitals.reduce((sum, h) => sum + h.buddycare, 0),
                                                                group.hospitals.reduce((sum, h) => sum + h.buddycare_past, 0),
                                                                "text-base font-bold text-[#00ADEF]"
                                                            )}
                                                        </td>
                                                        <td className="px-6 py-4 bg-indigo-50/30">
                                                            {renderComparisonCell(
                                                                group.hospitals.reduce((sum, h) => sum + (h.result || 0), 0),
                                                                group.hospitals.reduce((sum, h) => sum + (h.result_past || 0), 0),
                                                                "text-base font-black text-indigo-700"
                                                            )}
                                                        </td>
                                                        <td className="px-6 py-4 text-right bg-emerald-50/40">
                                                            <span className="text-base font-bold text-emerald-700">
                                                                {(() => {
                                                                    const target = group.hospitals.reduce((sum, h) => sum + (h.op || 0), 0);
                                                                    const current = group.hospitals.reduce((sum, h) => sum + (h.result || 0), 0);
                                                                    return formatPercent(target > 0 ? (current / target * 100) : 0);
                                                                })()}
                                                            </span>
                                                        </td>
                                                        <td className="px-6 py-4 text-right bg-emerald-50/20">
                                                            <span className="text-base font-bold text-emerald-600">
                                                                {(() => {
                                                                    const target = group.hospitals.reduce((sum, h) => sum + (h.op_30 || 0), 0);
                                                                    const current = group.hospitals.reduce((sum, h) => sum + (h.result || 0), 0);
                                                                    return formatPercent(target > 0 ? (current / target * 100) : 0);
                                                                })()}
                                                            </span>
                                                        </td>
                                                        <td className="px-6 py-4 text-right bg-red-50/40">
                                                            <span className="text-base font-bold text-[#FF6B6B]">
                                                                {(() => {
                                                                    const target = group.hospitals.reduce((sum, h) => sum + (h.op || 0), 0);
                                                                    const current = group.hospitals.reduce((sum, h) => sum + (h.result || 0), 0);
                                                                    return (target > 0 ? Math.max(0, target - current) : 0).toLocaleString();
                                                                })()}
                                                            </span>
                                                        </td>
                                                        <td className="px-6 py-4 text-right bg-red-50/20">
                                                            <span className="text-base font-bold text-rose-500">
                                                                {(() => {
                                                                    const target = group.hospitals.reduce((sum, h) => sum + (h.op_30 || 0), 0);
                                                                    const current = group.hospitals.reduce((sum, h) => sum + (h.result || 0), 0);
                                                                    return (target > 0 ? Math.max(0, target - current) : 0).toLocaleString();
                                                                })()}
                                                            </span>
                                                        </td>
                                                    </tr>
                                                </tbody>
                                            </table>
                                        </div>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                )}

                {filteredData.length === 0 && !loading && (
                    <div className="text-center py-20 opacity-50">
                        <p className="text-xl font-bold">ไม่พบข้อมูลที่ค้นหา</p>
                    </div>
                )}
            </div>
            <Footer />
        </main>
    );
}
