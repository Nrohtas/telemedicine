"use client";

import React, { useEffect, useState } from 'react';
import SoftCard from './ui/SoftCard';
import { motion } from 'framer-motion';

interface PerformanceItem {
    hospcode: string;
    hospname: string;
    amp_name: string;
    hostype_label: string;
    affiliation: string;
    current_total: number;
    his_tele: number;
    hdc_tele: number;
    total_all: number;
    performance_percent: number;
    his_percent: number;
    target: number;
}

const formatPercent = (val: number) => {
    const num = Number(val);
    if (isNaN(num)) return "0%";
    return new Intl.NumberFormat("th-TH", {
        minimumFractionDigits: 0,
        maximumFractionDigits: 2,
    }).format(num) + "%";
};

const TopPerformance = () => {

    const [data, setData] = useState<{
        hospitals: PerformanceItem[],
        primaryCare: PerformanceItem[],
        hospSummary?: { hdc_tele: number, hdc_opd: number, his_tele: number, his_opd: number, hdc_percent: number, his_percent: number },
        pcSummary?: { hdc_tele: number, hdc_opd: number, his_tele: number, his_opd: number, hdc_percent: number, his_percent: number },
        lastHdcUpdate?: string | null,
        lastHisUpdate?: string | null
    }>({ hospitals: [], primaryCare: [] });
    const [isLoading, setIsLoading] = useState(true);
    const [mounted, setMounted] = useState(false);

    const getAffiliationColor = (affiliation: string) => {
        if (!affiliation) return 'text-slate-900';
        if (affiliation === 'กระทรวงสาธารณสุข') return 'text-green-600';
        if (affiliation === 'องค์กรปกครองส่วนท้องถิ่น') return 'text-purple-600';
        return 'text-slate-900';
    };

    useEffect(() => {
        setMounted(true);
        const fetchPerformance = async () => {
            try {
                const res = await fetch('/telemedicine/api/daily/top-performance', { cache: 'no-store' });

                if (!res.ok) throw new Error('Fetch failed');
                const result = await res.json();
                if (result.hospitals && result.primaryCare) {
                    setData(result);
                }
            } catch (error) {
                console.error('Failed to fetch top performance:', error);
            } finally {
                setIsLoading(false);
            }
        };

        fetchPerformance();
    }, []);

    // Prevent hydration mismatch by only rendering after mount
    if (!mounted) return <div className="min-h-[200px]" />;

    if (isLoading) {
        return (
            <div className="w-full h-40 flex items-center justify-center">
                <div className="w-8 h-8 border-4 border-indigo-100 border-t-indigo-600 rounded-full animate-spin"></div>
            </div>
        );
    }

    const renderList = (items: PerformanceItem[], title: string, subtitle: string, iconColor: string, summaryData?: { hdc_tele: number, hdc_opd: number, his_tele: number, his_opd: number, hdc_percent: number, his_percent: number }, showDiff: boolean = false) => (
        <div className="flex flex-col gap-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 px-2">
                <div className="flex items-center gap-4">
                    <div className={`p-2.5 rounded-xl ${iconColor} text-white shadow-lg shadow-indigo-100`}>
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
                        </svg>
                    </div>
                    <div className="flex flex-col">
                        <h2 className="text-base md:text-lg font-black text-indigo-900 tracking-tight leading-none uppercase">{title}</h2>
                        <div className="flex items-center gap-2 mt-1.5">
                            <p className="text-[9px] font-black text-slate-500 uppercase tracking-[0.2em] opacity-80">{subtitle}</p>
                        </div>
                    </div>
                </div>
            </div>

            {summaryData && (
                <div className="px-1">
                    <div className="flex items-center justify-between p-4 bg-slate-100/40 border-2 border-slate-200 rounded-[2rem] shadow-sm gap-4">
                        <div className="flex-1 flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-blue-500/10 flex items-center justify-center text-[10px] font-black text-blue-600 border border-blue-100 shadow-inner">HIS</div>
                            <div className="flex flex-col">
                                <span className="text-[10px] font-black uppercase tracking-widest text-blue-500/70 leading-none mb-1">ผลงานรวม HIS</span>
                                <div className="flex items-baseline gap-1.5">
                                    <span className="text-xl font-black tabular-nums leading-none text-blue-700">{(summaryData?.his_tele || 0).toLocaleString()}</span>
                                    <span className="text-[10px] font-bold text-blue-500/70">ครั้ง</span>
                                    <div className="px-2 py-0.5 bg-blue-500 text-white text-[10px] font-black rounded-lg shadow-sm ml-1">
                                        {formatPercent(summaryData?.his_percent || 0)}
                                    </div>
                                </div>
                            </div>
                        </div>

                        {showDiff && (
                            <div className="flex flex-col items-center justify-center shrink-0">
                                <div className={`w-9 h-9 rounded-full shadow-lg border-2 flex flex-col items-center justify-center ${((summaryData?.hdc_tele || 0) - (summaryData?.his_tele || 0)) > 0 ? 'bg-emerald-50 border-emerald-200 text-emerald-700 shadow-emerald-100' :
                                    ((summaryData?.hdc_tele || 0) - (summaryData?.his_tele || 0)) < 0 ? 'bg-rose-50 border-rose-200 text-rose-700 shadow-rose-100' :
                                        'bg-slate-50 border-slate-200 text-slate-500 shadow-slate-100'
                                    }`}>
                                    <span className="text-[5px] font-black uppercase tracking-tighter leading-none mb-0.5 opacity-70">Diff</span>
                                    <span className="text-[11px] font-black tabular-nums leading-none">
                                        {((summaryData?.hdc_tele || 0) - (summaryData?.his_tele || 0)) > 0 ? `+${(summaryData?.hdc_tele || 0) - (summaryData?.his_tele || 0)}` : (summaryData?.hdc_tele || 0) - (summaryData?.his_tele || 0)}
                                    </span>
                                </div>
                            </div>
                        )}

                        <div className="flex-1 flex items-center justify-end gap-3 text-right">
                            <div className="flex flex-col items-end">
                                <span className="text-[10px] font-black uppercase tracking-widest text-emerald-500/70 leading-none mb-1">ผลงานรวม HDC</span>
                                <div className="flex items-baseline gap-1.5">
                                    <span className="text-xl font-black tabular-nums leading-none text-emerald-700">{(summaryData?.hdc_tele || 0).toLocaleString()}</span>
                                    <span className="text-[10px] font-bold text-emerald-500/70">ครั้ง</span>
                                    <div className="px-2 py-0.5 bg-emerald-500 text-white text-[10px] font-black rounded-lg shadow-sm ml-1">
                                        {formatPercent(summaryData?.hdc_percent || 0)}
                                    </div>
                                </div>
                            </div>
                            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 flex items-center justify-center text-[10px] font-black text-emerald-600 border border-emerald-100 shadow-inner">HDC</div>
                        </div>
                    </div>
                </div>
            )}

            <div className="flex flex-col gap-3">
                {!items || items.length === 0 ? (
                    <div className="p-8 text-center bg-slate-50/50 rounded-3xl border border-dashed border-slate-200">
                        <span className="text-xs font-bold text-slate-400">ยังไม่มีข้อมูลผลงานในกลุ่มนี้</span>
                    </div>
                ) : (
                    items.map((item, idx) => (
                        <motion.div
                            key={item.hospcode}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: idx * 0.05 }}
                            className="flex flex-col sm:flex-row sm:items-center justify-between p-3.5 bg-slate-50/50 border border-white rounded-[1.5rem] hover:bg-white hover:shadow-2xl hover:shadow-indigo-500/10 transition-all duration-300 group gap-4"
                        >
                            <div className="flex items-center gap-3 overflow-hidden">
                                <div className={`w-9 h-9 rounded-xl flex items-center justify-center font-black text-xs shrink-0 transition-all duration-300 group-hover:scale-110 shadow-sm border ${idx === 0 ? 'bg-gradient-to-br from-yellow-300 to-amber-500 text-amber-950 border-amber-200 shadow-amber-100' :
                                    idx === 1 ? 'bg-gradient-to-br from-slate-100 to-slate-300 text-slate-700 border-slate-200 shadow-slate-100' :
                                        idx === 2 ? 'bg-gradient-to-br from-orange-200 to-amber-600 text-amber-950 border-orange-200 shadow-orange-100' :
                                            'bg-slate-50/80 text-slate-500 border-slate-100 group-hover:bg-indigo-600 group-hover:text-white'
                                    }`}>
                                    {idx + 1}
                                </div>
                                <div className="min-w-0">
                                    <h3 className={`text-[12px] font-black truncate transition-colors whitespace-nowrap overflow-hidden text-ellipsis max-w-[180px] md:max-w-none ${getAffiliationColor(item.affiliation)}`}>
                                        {item.hospname.replace('โรงพยาบาลส่งเสริมสุขภาพตำบล', 'รพ.สต.').replace('โรงพยาบาล', 'รพ.')} ({item.hospcode})
                                    </h3>
                                    <div className="flex items-center gap-1 mt-0.5">
                                        <svg xmlns="http://www.w3.org/2000/svg" className="h-2.5 w-2.5 text-slate-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                                        </svg>
                                        <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">
                                            อ. {item.amp_name}
                                        </p>
                                    </div>
                                </div>
                            </div>

                            <div className="flex items-center gap-2">
                                <div className="flex items-center justify-between bg-blue-50/60 px-2.5 py-1.5 rounded-xl border border-blue-100/50 shadow-sm group-hover:bg-white transition-all duration-300 min-w-[155px] shrink-0">
                                    <div className="flex items-center gap-1.5">
                                        <div className="w-7 h-7 rounded-lg bg-blue-500/10 flex items-center justify-center text-[9px] font-black text-blue-600">HIS</div>
                                        <div className="flex items-baseline gap-0.5">
                                            <span className="text-[14px] font-black text-blue-700 tabular-nums">{(item.his_tele || 0).toLocaleString()}</span>
                                            <span className="text-[8px] font-bold text-blue-400">ครั้ง</span>
                                        </div>
                                    </div>
                                    <div className="px-1.5 py-0.5 bg-blue-500 text-white text-[9px] font-black rounded-lg shadow-sm shrink-0">
                                        {formatPercent(item.his_percent)}
                                    </div>
                                </div>

                                {showDiff && (() => {
                                    const diff = (item.hdc_tele || 0) - (item.his_tele || 0);
                                    return (
                                        <div className={`flex flex-col items-center justify-center w-7 h-7 shrink-0 rounded-full border shadow-sm transition-transform duration-300 group-hover:scale-110 ${diff > 0 ? 'bg-emerald-50 border-emerald-100 text-emerald-700' :
                                            diff < 0 ? 'bg-rose-50 border-rose-100 text-rose-700' :
                                                'bg-slate-50 border-slate-100 text-slate-500'
                                            }`}>
                                            <span className="text-[4px] font-black uppercase tracking-tighter opacity-70 leading-none mb-0.5">Diff</span>
                                            <span className="text-[9px] font-black tabular-nums leading-none">{diff > 0 ? `+${diff}` : diff}</span>
                                        </div>
                                    );
                                })()}

                                <div className="flex items-center justify-between bg-emerald-50/60 px-2.5 py-1.5 rounded-xl border border-emerald-100/50 shadow-sm group-hover:bg-white transition-all duration-300 min-w-[155px] shrink-0">
                                    <div className="flex items-center gap-1.5">
                                        <div className="w-7 h-7 rounded-lg bg-emerald-500/10 flex items-center justify-center text-[9px] font-black text-emerald-600">HDC</div>
                                        <div className="flex items-baseline gap-0.5">
                                            <span className="text-[14px] font-black text-emerald-700 tabular-nums">{(item.hdc_tele || 0).toLocaleString()}</span>
                                            <span className="text-[8px] font-bold text-emerald-400">ครั้ง</span>
                                        </div>
                                    </div>
                                    <div className="px-1.5 py-0.5 bg-emerald-500 text-white text-[9px] font-black rounded-lg shadow-sm shrink-0">
                                        {formatPercent(item.performance_percent)}
                                    </div>
                                </div>
                            </div>
                        </motion.div>
                    ))
                )}
            </div>
        </div>
    );

    return (
        <div className="py-8 relative z-10">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 relative z-10">
                {renderList(data.hospitals, "โรงพยาบาล", "ผลงานแพทย์ทางไกลสูงสุด (TYPE 5)", "bg-emerald-500", data.hospSummary, true)}
                {renderList(data.primaryCare, "รพ.สต./ศูนย์สุขภาพ", "ผลงานแพทย์ทางไกลสูงสุด (TYPE 5)", "bg-blue-500", data.pcSummary, true)}
            </div>

            <div className="mt-12 flex justify-center">
                <div className="h-1 w-12 bg-slate-100 rounded-full" />
            </div>
        </div>
    );
};

export default TopPerformance;
