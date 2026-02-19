"use client";

import React, { useEffect, useState, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import Navbar from "@/components/Navbar";
import SoftSelect from '@/components/ui/SoftSelect';

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
        return searchParams.get('amp_code') || "6501";
    });
    const [selectedStation, setSelectedStation] = useState("ทั้งหมด");

    useEffect(() => {
        fetch('/api/affiliations')
            .then(res => res.json())
            .then(data => setAffiliations(data))
            .catch(err => console.error('Failed to fetch affiliations:', err));
    }, []);

    useEffect(() => {
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

    const filteredData = data;

    const getRowColor = (hostypeName: string) => {
        if (hostypeName === 'กระทรวงสาธารณสุข') return 'text-green-600';
        if (hostypeName === 'องค์กรปกครองส่วนท้องถิ่น') return 'text-purple-600';
        return 'text-black';
    };

    const getHostColor = (type: string) => {
        switch (type) {
            case '05': return 'text-purple-500'; // รพช.
            case '06': return 'text-blue-500';   // รพท.
            case '07': return 'text-indigo-500'; // รพศ.
            default: return 'text-green-600';     // รพ.สต.
        }
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
            />

            <div className="px-6 max-w-7xl mx-auto">
                {/* Search Bar */}


                {loading ? (
                    <div className="flex justify-center items-center py-20">
                        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-nm-primary"></div>
                    </div>
                ) : (
                    <div className="space-y-12">
                        {selectedDistrict === 'ทั้งหมด' ? (
                            /* Unified Province-Wide Table */
                            <div className="space-y-4">
                                <div className="flex items-center gap-4 px-2">
                                    <div className="h-px w-8 bg-nm-primary/20"></div>
                                    <h3 className="text-lg font-bold text-nm-primary opacity-80">สรุปข้อมูลทั้งจังหวัด</h3>
                                    <div className="h-px flex-1 bg-gradient-to-r from-nm-primary/20 to-transparent"></div>
                                </div>

                                <div className="bg-white/50 backdrop-blur-sm border border-white/60 rounded-xl shadow-sm">
                                    <table className="w-full text-left border-collapse">
                                        <thead className="sticky top-0 z-20 bg-[#FDFBFF]">
                                            <tr className="bg-nm-primary/5 text-nm-primary text-xs uppercase tracking-wider font-bold border-b border-nm-primary/10">
                                                <th className="px-6 py-4 w-24">รหัส</th>
                                                <th className="px-6 py-4">ชื่อหน่วยบริการ</th>
                                                <th className="px-6 py-4 w-32">อำเภอ</th>
                                                <th className="px-6 py-4 w-32">ตำบล</th>
                                                <th className="px-6 py-4 w-32">ประเภท</th>
                                                <th className="px-6 py-4 w-32 text-right text-[#006837]">หมอพร้อม STATION</th>
                                                <th className="px-6 py-4 w-32 text-right text-[#00ADEF]">สอน.บัดดี้</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-gray-100">
                                            {filteredData
                                                .flatMap(group => group.hospitals)
                                                .sort((a, b) => a.hospcode.localeCompare(b.hospcode))
                                                .map((hospital) => {
                                                    const rowColor = getRowColor(hospital.hostype_name);
                                                    return (
                                                        <tr key={hospital.hospcode} className="group hover:bg-white/60 transition-colors duration-200">
                                                            <td className={`px-6 py-3 font-mono text-sm opacity-70 font-bold ${rowColor}`}>
                                                                {hospital.hospcode}
                                                            </td>
                                                            <td className="px-6 py-3">
                                                                <span className={`text-sm font-bold transition-colors cursor-pointer ${rowColor}`}>
                                                                    {hospital.hospname}
                                                                </span>
                                                            </td>
                                                            <td className="px-6 py-3 text-sm opacity-70 font-bold">
                                                                อ.{hospital.amp_name}
                                                            </td>
                                                            <td className="px-6 py-3 text-sm opacity-70">
                                                                ต.{hospital.tmb_name || '-'}
                                                            </td>
                                                            <td className="px-6 py-3">
                                                                <span className={`text-xs font-bold px-2 py-1 rounded-md bg-opacity-10 ${getHostColor(hospital.hostype).replace('text-', 'bg-')} ${getHostColor(hospital.hostype)}`}>
                                                                    {hospital.hostype_level || (hospital.hostype === '05' ? 'รพช.' : hospital.hostype === '06' ? 'รพท.' : hospital.hostype === '07' ? 'รพศ.' : 'รพ.สต.')}
                                                                </span>
                                                            </td>
                                                            <td className="px-6 py-3 text-right">
                                                                <span className="text-sm font-bold text-[#006837]">{hospital.moph.toLocaleString()}</span>
                                                            </td>
                                                            <td className="px-6 py-3 text-right">
                                                                <span className="text-sm font-bold text-[#00ADEF]">{hospital.buddycare.toLocaleString()}</span>
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
                                            </tr>
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        ) : (
                            /* Existing District-Grouped Tables */
                            filteredData.map((group) => (
                                <div key={group.amp_code} className="space-y-4">
                                    <div className="flex items-center gap-4 px-2">
                                        <div className="h-px w-8 bg-nm-primary/20"></div>
                                        <h3 className="text-lg font-bold text-nm-primary opacity-80">อำเภอ{group.amp_name}</h3>
                                        <div className="h-px flex-1 bg-gradient-to-r from-nm-primary/20 to-transparent"></div>
                                    </div>

                                    <div className="bg-white/50 backdrop-blur-sm border border-white/60 rounded-xl shadow-sm">
                                        <table className="w-full text-left border-collapse">
                                            <thead className="sticky top-0 z-20 bg-[#FDFBFF]">
                                                <tr className="bg-nm-primary/5 text-nm-primary text-xs uppercase tracking-wider font-bold border-b border-nm-primary/10">
                                                    <th className="px-6 py-4 w-24">รหัส</th>
                                                    <th className="px-6 py-4">ชื่อหน่วยบริการ</th>
                                                    <th className="px-6 py-4 w-40">ตำบล</th>
                                                    <th className="px-6 py-4 w-32">ประเภท</th>
                                                    <th className="px-6 py-4 w-32 text-right text-[#006837]">หมอพร้อม STATION</th>
                                                    <th className="px-6 py-4 w-32 text-right text-[#00ADEF]">สอน.บัดดี้</th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-gray-100">
                                                {group.hospitals.map((hospital) => {
                                                    const rowColor = getRowColor(hospital.hostype_name);
                                                    return (
                                                        <tr key={hospital.hospcode} className="group hover:bg-white/60 transition-colors duration-200">
                                                            <td className={`px-6 py-3 font-mono text-sm opacity-70 font-bold ${rowColor}`}>
                                                                {hospital.hospcode}
                                                            </td>
                                                            <td className="px-6 py-3">
                                                                <span className={`text-sm font-bold transition-colors cursor-pointer ${rowColor}`}>
                                                                    {hospital.hospname}
                                                                </span>
                                                            </td>
                                                            <td className="px-6 py-3 text-sm opacity-70">
                                                                ต.{hospital.tmb_name || '-'}
                                                            </td>
                                                            <td className="px-6 py-3">
                                                                <span className={`text-xs font-bold px-2 py-1 rounded-md bg-opacity-10 ${getHostColor(hospital.hostype).replace('text-', 'bg-')} ${getHostColor(hospital.hostype)}`}>
                                                                    {hospital.hostype_level || (hospital.hostype === '05' ? 'รพช.' : hospital.hostype === '06' ? 'รพท.' : hospital.hostype === '07' ? 'รพศ.' : 'รพ.สต.')}
                                                                </span>
                                                            </td>
                                                            <td className="px-6 py-3 text-right">
                                                                <span className="text-sm font-bold text-[#006837]">{hospital.moph.toLocaleString()}</span>
                                                            </td>
                                                            <td className="px-6 py-3 text-right">
                                                                <span className="text-sm font-bold text-[#00ADEF]">{hospital.buddycare.toLocaleString()}</span>
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
                                                </tr>
                                            </tbody>
                                        </table>
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
        </main>
    );
}
