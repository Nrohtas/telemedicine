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
}

interface DistrictGroup {
    amp_name: string;
    amp_code: string;
    hospitals: Hospital[];
}

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
    const [selectedType, setSelectedType] = useState("ทั้งหมด");
    const [selectedDistrict, setSelectedDistrict] = useState(() => {
        return searchParams.get('amp_code') || "เลือกอำเภอ";
    });
    const [selectedStation, setSelectedStation] = useState("ทั้งหมด");
    const [searchTerm, setSearchTerm] = useState("");

    useEffect(() => {
        fetch('/api/affiliations')
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

        const url = `/api/hospital-directory?${params.toString()}`;

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
        const exportData = filteredData.flatMap(group =>
            group.hospitals.map(h => ({
                "รหัส": h.hospcode,
                "ชื่อหน่วยบริการ": h.hospname,
                "อำเภอ": h.amp_name,
                "ตำบล": h.tmb_name || '-',
                "ประเภท": h.hostype_level || h.hostype_name,
                "หมอพร้อม STATION": h.moph,
                "สอน.บัดดี้": h.buddycare,
                "รวม": h.moph + h.buddycare
            }))
        );

        if (exportData.length === 0) {
            alert("ไม่พบข้อมูลที่จะส่งออก");
            return;
        }

        const ws = utils.json_to_sheet(exportData);
        const wb = utils.book_new();
        utils.book_append_sheet(wb, ws, "รายชื่อหน่วยบริการ");

        // Set column widths
        const wscols = [
            { wch: 10 }, // รหัส
            { wch: 40 }, // ชื่อหน่วยบริการ
            { wch: 15 }, // อำเภอ
            { wch: 15 }, // ตำบล
            { wch: 15 }, // ประเภท
            { wch: 20 }, // หมอพร้อม STATION
            { wch: 15 }, // สอน.บัดดี้
            { wch: 10 }, // รวม
        ];
        ws['!cols'] = wscols;

        const now = new Date();
        const dateStr = now.getFullYear().toString() +
            (now.getMonth() + 1).toString().padStart(2, '0') +
            now.getDate().toString().padStart(2, '0');
        const timeStr = now.getHours().toString().padStart(2, '0') +
            now.getMinutes().toString().padStart(2, '0') +
            now.getSeconds().toString().padStart(2, '0');

        let districtName = "hospital";
        if (selectedDistrict === 'ทั้งหมด') {
            districtName = "ทั้งจังหวัด";
        } else if (filteredData.length > 0) {
            districtName = filteredData[0].amp_name;
        }

        writeFileXLSX(wb, `Telemedicine_${districtName}_${dateStr}_${timeStr}.xlsx`);
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

    return (
        <main className="min-h-screen pb-12 bg-background">
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
            />

            <div className="px-6 max-w-7xl mx-auto pt-6 flex justify-end items-center gap-3">
                <LastUpdate />
            </div>

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
                                    <button
                                        onClick={handleExportExcel}
                                        className="flex items-center gap-1.5 px-2.5 h-[22px] bg-white hover:bg-white border border-slate-100 rounded-full transition-all duration-200 group text-slate-600 hover:text-nm-primary leading-none shadow-sm"
                                    >
                                        <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 text-[#1D6F42] group-hover:scale-110 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                        </svg>
                                        <span className="font-bold text-[9px] uppercase tracking-wider">Export Excel</span>
                                    </button>
                                </div>

                                <div className="bg-white/50 backdrop-blur-sm border border-white/60 rounded-xl shadow-sm overflow-hidden">
                                    <div className="overflow-x-auto overflow-y-auto max-h-[70vh] custom-scrollbar">
                                        <table className="w-full text-left border-collapse min-w-[800px]">
                                            <thead className="sticky top-0 z-20 bg-[#FDFBFF] shadow-sm">
                                                <tr className="bg-nm-primary/5 text-nm-primary text-xs uppercase tracking-wider font-bold border-b border-nm-primary/10">
                                                    <th className="px-6 py-4 w-24 sticky left-0 z-10 bg-[#FDFBFF]/95 backdrop-blur-sm shadow-[inset_-1px_0_0_0_rgba(0,0,0,0.05)]">รหัส</th>
                                                    <th className="px-6 py-4 whitespace-nowrap">ชื่อหน่วยบริการ</th>
                                                    <th className="px-6 py-4 w-40 whitespace-nowrap">อำเภอ</th>
                                                    <th className="px-6 py-4 w-40 whitespace-nowrap">ตำบล</th>
                                                    <th className="px-6 py-4 w-32 whitespace-nowrap">ประเภท</th>
                                                    <th className="px-6 py-4 w-32 text-right text-[#006837] whitespace-nowrap">หมอพร้อม STATION</th>
                                                    <th className="px-6 py-4 w-32 text-right text-[#00ADEF] whitespace-nowrap">สอน.บัดดี้</th>
                                                    <th className="px-6 py-4 w-32 text-right text-indigo-700 whitespace-nowrap">รวม</th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-gray-100">
                                                {filteredData
                                                    .flatMap(group => group.hospitals)
                                                    .sort((a, b) => a.hospcode.localeCompare(b.hospcode))
                                                    .map((hospital) => {
                                                        const rowColor = getRowColor(hospital.hostype_name);
                                                        return (
                                                            <tr key={hospital.hospcode} className="group hover:bg-slate-50 transition-colors duration-200">
                                                                <td className={`px-6 py-3 font-mono text-sm opacity-70 font-bold ${rowColor} sticky left-0 z-10 bg-white/95 backdrop-blur-sm shadow-[inset_-1px_0_0_0_rgba(0,0,0,0.03)]`}>
                                                                    {hospital.hospcode}
                                                                </td>
                                                                <td className="px-6 py-3">
                                                                    <span className={`text-sm font-bold transition-colors cursor-pointer whitespace-nowrap ${rowColor}`}>
                                                                        {hospital.hospname}
                                                                    </span>
                                                                </td>
                                                                <td className="px-6 py-3 text-sm opacity-70 font-bold whitespace-nowrap">
                                                                    อ.{hospital.amp_name}
                                                                </td>
                                                                <td className="px-6 py-3 text-sm opacity-70 whitespace-nowrap">
                                                                    ต.{hospital.tmb_name || '-'}
                                                                </td>
                                                                <td className="px-6 py-3 whitespace-nowrap">
                                                                    {(() => {
                                                                        const label = hospital.hostype_level || (hospital.hostype === '05' ? 'รพ.' : hospital.hostype === '06' ? 'รพท.' : hospital.hostype === '07' ? 'รพศ.' : 'รพ.สต.');
                                                                        const colorClass = getHostColor(label);
                                                                        return (
                                                                            <span className={`text-xs font-bold px-2 py-1 rounded-md bg-opacity-10 ${colorClass.replace('text-', 'bg-')} ${colorClass} whitespace-nowrap`}>
                                                                                {label}
                                                                            </span>
                                                                        );
                                                                    })()}
                                                                </td>
                                                                <td className="px-6 py-3 text-right">
                                                                    <span className="text-sm font-bold text-[#006837]">{hospital.moph.toLocaleString()}</span>
                                                                </td>
                                                                <td className="px-6 py-3 text-right">
                                                                    <span className="text-sm font-bold text-[#00ADEF]">{hospital.buddycare.toLocaleString()}</span>
                                                                </td>
                                                                <td className="px-6 py-3 text-right bg-indigo-50/30">
                                                                    <span className="text-sm font-black text-indigo-700">{(hospital.moph + hospital.buddycare).toLocaleString()}</span>
                                                                </td>
                                                            </tr>
                                                        );
                                                    })}
                                                {/* Unified Summary Row */}
                                                <tr className="bg-nm-primary/10 font-bold border-t-2 border-nm-primary/30">
                                                    <td colSpan={5} className="px-6 py-5 text-nm-primary text-right text-base">
                                                        รวมทั้งจังหวัด
                                                    </td>
                                                    <td className="px-6 py-5 text-right">
                                                        <span className="text-xl text-[#006837]">
                                                            {filteredData.reduce((total, group) => total + group.hospitals.reduce((sum, h) => sum + h.moph, 0), 0).toLocaleString()}
                                                        </span>
                                                    </td>
                                                    <td className="px-6 py-5 text-right">
                                                        <span className="text-xl text-[#00ADEF]">
                                                            {filteredData.reduce((total, group) => total + group.hospitals.reduce((sum, h) => sum + h.buddycare, 0), 0).toLocaleString()}
                                                        </span>
                                                    </td>
                                                    <td className="px-6 py-5 text-right bg-indigo-50/50">
                                                        <span className="text-xl font-black text-indigo-700">
                                                            {filteredData.reduce((total, group) => total + group.hospitals.reduce((sum, h) => sum + h.moph + h.buddycare, 0), 0).toLocaleString()}
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
                            filteredData.map((group) => (
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
                                        <button
                                            onClick={handleExportExcel}
                                            className="flex items-center gap-1.5 px-2.5 h-[22px] bg-white hover:bg-white border border-slate-100 rounded-full transition-all duration-200 group text-slate-600 hover:text-nm-primary leading-none shadow-sm ml-1"
                                        >
                                            <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 text-[#1D6F42] group-hover:scale-110 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                            </svg>
                                            <span className="font-bold text-[9px] uppercase tracking-wider">Export Excel</span>
                                        </button>
                                    </div>

                                    <div className="bg-white/50 backdrop-blur-sm border border-white/60 rounded-xl shadow-sm overflow-hidden">
                                        <div className="overflow-x-auto overflow-y-auto max-h-[70vh] custom-scrollbar">
                                            <table className="w-full text-left border-collapse min-w-[800px]">
                                                <thead className="sticky top-0 z-20 bg-[#FDFBFF] shadow-sm">
                                                    <tr className="bg-nm-primary/5 text-nm-primary text-xs uppercase tracking-wider font-bold border-b border-nm-primary/10">
                                                        <th className="px-6 py-4 w-24 sticky left-0 z-10 bg-[#FDFBFF]/95 backdrop-blur-sm shadow-[inset_-1px_0_0_0_rgba(0,0,0,0.05)]">รหัส</th>
                                                        <th className="px-6 py-4 whitespace-nowrap">ชื่อหน่วยบริการ</th>
                                                        <th className="px-6 py-4 w-40 whitespace-nowrap">ตำบล</th>
                                                        <th className="px-6 py-4 w-32 whitespace-nowrap">ประเภท</th>
                                                        <th className="px-6 py-4 w-32 text-right text-[#006837] whitespace-nowrap">หมอพร้อม STATION</th>
                                                        <th className="px-6 py-4 w-32 text-right text-[#00ADEF] whitespace-nowrap">สอน.บัดดี้</th>
                                                        <th className="px-6 py-4 w-32 text-right text-indigo-700 whitespace-nowrap">รวม</th>
                                                    </tr>
                                                </thead>
                                                <tbody className="divide-y divide-gray-100">
                                                    {group.hospitals.map((hospital) => {
                                                        const rowColor = getRowColor(hospital.hostype_name);
                                                        return (
                                                            <tr key={hospital.hospcode} className="group hover:bg-slate-50 transition-colors duration-200">
                                                                <td className={`px-6 py-3 font-mono text-sm opacity-70 font-bold ${rowColor} sticky left-0 z-10 bg-white/95 backdrop-blur-sm group-hover:bg-slate-50 shadow-[1px_0_0_0_rgba(0,0,0,0.03)]`}>
                                                                    {hospital.hospcode}
                                                                </td>
                                                                <td className="px-6 py-3">
                                                                    <span className={`text-sm font-bold transition-colors cursor-pointer whitespace-nowrap ${rowColor}`}>
                                                                        {hospital.hospname}
                                                                    </span>
                                                                </td>
                                                                <td className="px-6 py-3 text-sm opacity-70 whitespace-nowrap">
                                                                    ต.{hospital.tmb_name || '-'}
                                                                </td>
                                                                <td className="px-6 py-3 whitespace-nowrap">
                                                                    {(() => {
                                                                        const label = hospital.hostype_level || (hospital.hostype === '05' ? 'รพ.' : hospital.hostype === '06' ? 'รพท.' : hospital.hostype === '07' ? 'รพศ.' : 'รพ.สต.');
                                                                        const colorClass = getHostColor(label);
                                                                        return (
                                                                            <span className={`text-xs font-bold px-2 py-1 rounded-md bg-opacity-10 ${colorClass.replace('text-', 'bg-')} ${colorClass} whitespace-nowrap`}>
                                                                                {label}
                                                                            </span>
                                                                        );
                                                                    })()}
                                                                </td>
                                                                <td className="px-6 py-3 text-right">
                                                                    <span className="text-sm font-bold text-[#006837]">{hospital.moph.toLocaleString()}</span>
                                                                </td>
                                                                <td className="px-6 py-3 text-right">
                                                                    <span className="text-sm font-bold text-[#00ADEF]">{hospital.buddycare.toLocaleString()}</span>
                                                                </td>
                                                                <td className="px-6 py-3 text-right bg-indigo-50/30">
                                                                    <span className="text-sm font-black text-indigo-700">{(hospital.moph + hospital.buddycare).toLocaleString()}</span>
                                                                </td>
                                                            </tr>
                                                        );
                                                    })}
                                                    {/* Summary Row */}
                                                    <tr className="bg-nm-primary/5 font-bold border-t-2 border-nm-primary/20">
                                                        <td colSpan={4} className="px-6 py-4 text-nm-primary text-right">
                                                            รวมทั้งหมด
                                                        </td>
                                                        <td className="px-6 py-4 text-right">
                                                            <span className="text-base text-[#006837]">
                                                                {group.hospitals.reduce((sum, h) => sum + h.moph, 0).toLocaleString()}
                                                            </span>
                                                        </td>
                                                        <td className="px-6 py-4 text-right">
                                                            <span className="text-base text-[#00ADEF]">
                                                                {group.hospitals.reduce((sum, h) => sum + h.buddycare, 0).toLocaleString()}
                                                            </span>
                                                        </td>
                                                        <td className="px-6 py-4 text-right bg-indigo-50/30">
                                                            <span className="text-base font-black text-indigo-700">
                                                                {group.hospitals.reduce((sum, h) => sum + h.moph + h.buddycare, 0).toLocaleString()}
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
