"use client";

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import SoftCard from './ui/SoftCard';
import CircularProgress from './ui/CircularProgress';

interface DistrictStat {
    amp_code: string;
    amp_name: string;
    mohpromt_count: number;
    sornbuddy_count: number;
    total_result: number;
    total_result_past: number;
    target_30: number;
}

interface DistrictTableProps {
    type?: string;
}

export default function DistrictTable({ type }: DistrictTableProps = {}) {
    const [stats, setStats] = useState<DistrictStat[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        // Fetch stats
        const url = type ? `/telemedicine/api/ampur-stats?type=${encodeURIComponent(type)}` : '/telemedicine/api/ampur-stats';
        fetch(url)
            .then(res => res.json())
            .then(data => {
                if (Array.isArray(data)) {
                    setStats(data);
                    setError(null);
                } else {
                    console.error('API Error:', data);
                    setError(data.error || 'ไม่สามารถโหลดข้อมูลได้');
                }
                setLoading(false);
            })
            .catch(err => {
                console.error('Error fetching district stats:', err);
                setError('เกิดข้อผิดพลาดในการเชื่อมต่อฐานข้อมูล');
                setLoading(false);
            });
    }, [type]);

    if (loading) {
        return (
            <div className="flex justify-center items-center h-48">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-nm-primary"></div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="p-8 text-center bg-red-50 rounded-2xl border border-red-100">
                <p className="text-red-500 font-bold mb-2">ขออภัย! {error}</p>
                <button
                    onClick={() => { setLoading(true); window.location.reload(); }}
                    className="text-xs text-red-600 underline font-bold uppercase tracking-wider"
                >
                    ลองอีกครั้ง
                </button>
            </div>
        );
    }

    // Find max value for relative progress bars
    const maxVal = Array.isArray(stats) && stats.length > 0
        ? Math.max(...stats.map(s => Math.max(s.mohpromt_count || 0, s.sornbuddy_count || 0)), 1)
        : 1;

    return (
        <div className="space-y-8">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {(() => {
                    const sortedStats = [...stats].sort((a, b) => {
                        const rateA = a.target_30 > 0 ? (a.total_result / a.target_30) : 0;
                        const rateB = b.target_30 > 0 ? (b.total_result / b.target_30) : 0;
                        if (rateB !== rateA) return rateB - rateA;
                        return (b.total_result || 0) - (a.total_result || 0); // fallback to total result
                    });
                    return sortedStats.map((stat) => {
                        const rank = sortedStats.findIndex(s => s.amp_code === stat.amp_code) + 1;
                        const diff = (stat.total_result || 0) - (stat.total_result_past || 0);
                        const completionRate = stat.target_30 > 0 ? (stat.total_result / stat.target_30) * 100 : 0;

                        return (
                            <Link key={stat.amp_code} href={`/hospital?amp_code=${stat.amp_code}${type ? `&type=${encodeURIComponent(type)}` : ''}`} className="block">
                                <SoftCard className="p-5 group hover:scale-[1.01] transition-all duration-500 cursor-pointer h-full relative overflow-hidden border-b-4 border-indigo-200">
                                    {/* Decorative background for the card */}
                                    <div className="absolute top-0 right-0 w-24 h-24 bg-indigo-50/50 rounded-full -mr-12 -mt-12 blur-2xl group-hover:bg-indigo-100/60 transition-colors" />

                                    <div className="flex flex-col gap-4 relative z-10">
                                        {/* Header Row: Rank and Name */}
                                        <div className="flex items-start justify-between">
                                            <div className="flex items-center gap-3">
                                                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-black text-white shadow-lg ${rank === 1 ? 'bg-amber-400' : rank === 2 ? 'bg-slate-400' : rank === 3 ? 'bg-orange-400' : 'bg-indigo-400'}`}>
                                                    {rank}
                                                </div>
                                                <div>
                                                    <h4 className="font-black text-lg group-hover:text-nm-primary transition-colors leading-tight">{stat.amp_name}</h4>
                                                </div>
                                            </div>

                                            <div className="flex flex-col items-end">
                                                {/* Container to sync width of badges and ratio bar */}
                                                <div className="inline-flex flex-col gap-1.5">
                                                    {/* Shift platforms to top corner in a compact way */}
                                                    <div className="flex gap-2">
                                                        {/* MOPH Badge */}
                                                        <div className="bg-emerald-50/50 text-[#006837] px-2 py-1.5 rounded-xl border border-emerald-100/50 flex flex-col items-center gap-0.5 shadow-sm min-w-[54px]">
                                                            <div className="flex items-center gap-1">
                                                                <svg width="12" height="12" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
                                                                    <circle cx="50" cy="22" r="14" fill="#006837" />
                                                                    <path d="M25 40H75V75C75 80 71 84 66 84H34C29 84 25 80 25 75V40Z" stroke="#F6D76E" strokeWidth="10" />
                                                                </svg>
                                                                <span className="text-[12px] font-black leading-none">{(stat.mohpromt_count || 0).toLocaleString()}</span>
                                                            </div>
                                                            <span className="text-[7px] font-black uppercase tracking-tighter opacity-70">หมอพร้อม</span>
                                                        </div>

                                                        {/* SORN Badge */}
                                                        <div className="bg-sky-50/50 text-[#00ADEF] px-2 py-1.5 rounded-xl border border-sky-100/50 flex flex-col items-center gap-0.5 shadow-sm min-w-[54px]">
                                                            <div className="flex items-center gap-1">
                                                                <svg width="12" height="12" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
                                                                    <path d="M10 45L50 15L90 45" stroke="#00ADEF" strokeWidth="12" strokeLinecap="round" />
                                                                    <circle cx="75" cy="62" r="8" fill="#0060A9" />
                                                                </svg>
                                                                <span className="text-[12px] font-black leading-none">{(stat.sornbuddy_count || 0).toLocaleString()}</span>
                                                            </div>
                                                            <span className="text-[7px] font-black uppercase tracking-tighter opacity-70">สอน.บัดดี้</span>
                                                        </div>
                                                    </div>
                                                    {/* Ratio Bar synced to width */}
                                                    <div className="w-full space-y-1">
                                                        <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden flex shadow-inner">
                                                            <div
                                                                className="h-full bg-[#006837] transition-all duration-1000 ease-out"
                                                                style={{ width: `${stat.total_result > 0 ? ((stat.mohpromt_count || 0) / stat.total_result) * 100 : 0}%` }}
                                                            ></div>
                                                            <div
                                                                className="h-full bg-[#00ADEF] transition-all duration-1000 ease-out"
                                                                style={{ width: `${stat.total_result > 0 ? ((stat.sornbuddy_count || 0) / stat.total_result) * 100 : 0}%` }}
                                                            ></div>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Main Stats Row: Past -> Growth -> Latest */}
                                        <div className="flex items-stretch bg-slate-100 rounded-xl overflow-hidden border border-slate-100 shadow-sm relative">
                                            {/* Previous Stats (Left) */}
                                            <div className="flex-1 bg-slate-50/80 p-3 flex flex-col gap-1 border-r border-slate-100">
                                                <span className="text-[8px] font-black text-gray-400 uppercase tracking-widest">ครั้งก่อน</span>
                                                <div className="flex items-baseline gap-1">
                                                    <span className="text-xl font-black text-gray-500 tracking-tighter">{(stat.total_result_past || 0).toLocaleString()}</span>
                                                    <span className="text-[8px] font-bold text-gray-400 uppercase">ครั้ง</span>
                                                </div>
                                            </div>

                                            {/* Growth Indicator (Center Overlap) - Expanded for visibility */}
                                            {diff !== 0 && (
                                                <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-20">
                                                    <div className={`px-3 py-1 rounded-full text-[12px] font-black border-2 shadow-md flex items-center justify-center whitespace-nowrap bg-white ${diff > 0 ? 'text-emerald-600 border-emerald-100' : 'bg-rose-50 text-rose-600 border-rose-100'}`}>
                                                        {diff > 0 ? '+' : ''}{diff.toLocaleString()}
                                                    </div>
                                                </div>
                                            )}

                                            {/* Latest Stats (Right) */}
                                            <div className="flex-1 bg-white p-3 flex flex-col items-end gap-1 text-right">
                                                <span className="text-[8px] font-black text-indigo-400 uppercase tracking-widest">ผลงานล่าสุด</span>
                                                <div className="flex items-baseline gap-1">
                                                    <span className="text-xl font-black text-indigo-700 tracking-tighter">{(stat.total_result || 0).toLocaleString()}</span>
                                                    <span className="text-[8px] font-bold text-indigo-400 uppercase">ครั้ง</span>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                    {/* Spacing gap between rows - reduced as requested */}
                                    <div className="mt-2 space-y-6 relative z-10">
                                        {/* Main Highlight Row: Missing, Target, Percent - 3-column Grid */}
                                        <div className="grid grid-cols-3 gap-2">
                                            {/* Missing Box */}
                                            <div className="bg-gradient-to-br from-amber-50 to-white p-3 rounded-2xl border border-amber-100 shadow-sm flex flex-col items-center justify-center text-center">
                                                <div className="flex items-center gap-1 mb-1">
                                                    <div className="p-0.5 rounded bg-amber-100/50 text-amber-600">
                                                        <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round">
                                                            <path d="M22 12h-4l-3 9L9 3l-3 9H2" />
                                                        </svg>
                                                    </div>
                                                    <span className="text-[9px] font-black text-amber-600 uppercase tracking-widest">ขาดอีก</span>
                                                </div>
                                                <span className="text-xl font-black text-amber-700 leading-none">{Math.max(0, Math.round(stat.target_30) - stat.total_result).toLocaleString()}</span>
                                                <span className="text-[8px] font-bold text-amber-400 uppercase mt-1">ครั้ง</span>
                                            </div>

                                            {/* Target Box */}
                                            <div className="bg-gradient-to-br from-rose-50 to-white p-3 rounded-2xl border border-rose-100 shadow-sm flex flex-col items-center justify-center text-center">
                                                <div className="flex items-center gap-1 mb-1">
                                                    <div className="p-0.5 rounded bg-rose-100 text-rose-600">
                                                        <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round">
                                                            <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                                                            <polyline points="22 4 12 14.01 9 11.01" />
                                                        </svg>
                                                    </div>
                                                    <span className="text-[9px] font-black text-rose-600 uppercase tracking-widest">เป้าหมาย</span>
                                                </div>
                                                <span className="text-xl font-black text-rose-700 leading-none">{Math.round(stat.target_30).toLocaleString()}</span>
                                                <span className="text-[8px] font-bold text-rose-400 uppercase mt-1">ครั้ง</span>
                                            </div>

                                            {/* Completion Circle (No outer border/bg, larger size) */}
                                            <div className="flex flex-col items-center justify-center overflow-hidden h-full">
                                                <CircularProgress
                                                    value={completionRate}
                                                    size={80}
                                                    strokeWidth={7}
                                                    color="#059669"
                                                    bgColor="#E1EFEA"
                                                >
                                                    <div className="flex flex-col items-center">
                                                        <span className="text-[8px] font-black text-emerald-600/60 uppercase tracking-tighter leading-none mb-0.5">ผลงาน</span>
                                                        <div className="flex items-baseline leading-none">
                                                            <span className="text-lg font-black text-emerald-700 tracking-tighter">{completionRate.toFixed(2)}</span>
                                                            <span className="text-[8px] font-black text-emerald-700/60">%</span>
                                                        </div>
                                                    </div>
                                                </CircularProgress>
                                            </div>
                                        </div>

                                    </div>
                                </SoftCard>
                            </Link>
                        );
                    });
                })()}
            </div>
        </div>
    );
}
