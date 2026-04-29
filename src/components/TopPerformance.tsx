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
    total_all: number;
    performance_percent: number;
    target: number;
}

const TopPerformance = () => {

    const [data, setData] = useState<{ 
        hospitals: PerformanceItem[], 
        primaryCare: PerformanceItem[],
        hospSummary?: { total_visit_5: number, total_all: number, percent: number },
        pcSummary?: { total_visit_5: number, total_all: number, percent: number }
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

    const renderList = (items: PerformanceItem[], title: string, subtitle: string, iconColor: string, summaryData?: { total_visit_5: number, percent: number }, summaryLabel: string = "สรุปยอดรวม") => (
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
                        <p className="text-[9px] font-black text-slate-500 uppercase tracking-[0.2em] mt-1.5 opacity-80">{subtitle}</p>
                    </div>
                </div>

                {summaryData && (
                    <div className="flex items-center gap-2 bg-indigo-50/50 p-1.5 pr-3 rounded-2xl border border-indigo-100/50 shadow-sm animate-in fade-in slide-in-from-right-4 duration-700">
                        <div className="flex items-center gap-2 px-3 py-1 bg-white rounded-xl shadow-sm border border-indigo-50">
                            <span className="text-[10px] font-black text-indigo-400 uppercase tracking-tighter">{summaryLabel}</span>
                            <span className="text-base font-black text-indigo-700 tabular-nums">
                                {Number(summaryData.total_visit_5).toLocaleString()}
                            </span>
                            <span className="text-[9px] font-black text-indigo-300">ครั้ง</span>
                        </div>
                        <div className="flex items-center gap-1.5 bg-emerald-500 text-white px-3 py-1.5 rounded-xl text-xs font-black shadow-md shadow-emerald-200">
                            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round">
                                <polyline points="23 6 13.5 15.5 8.5 10.5 1 18"></polyline>
                                <polyline points="17 6 23 6 23 12"></polyline>
                            </svg>
                            {Number(summaryData.percent).toFixed(2)}%
                        </div>
                    </div>
                )}
            </div>

            <div className="flex flex-col gap-3">
                {items.length === 0 ? (
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
                            className="flex items-center justify-between p-3 bg-slate-50/50 border border-white rounded-[1.25rem] hover:bg-white hover:shadow-xl hover:shadow-indigo-500/10 transition-all duration-300 group"
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
                                    <h3 className={`text-[11px] font-black truncate transition-colors whitespace-nowrap overflow-hidden text-ellipsis max-w-[150px] md:max-w-none ${getAffiliationColor(item.affiliation)}`}>
                                        {item.hospname.replace('โรงพยาบาลส่งเสริมสุขภาพตำบล', 'รพ.สต.').replace('โรงพยาบาล', 'รพ.')} ({item.hospcode})
                                    </h3>
                                    <div className="flex items-center gap-1 mt-0.5">
                                        <svg xmlns="http://www.w3.org/2000/svg" className="h-2.5 w-2.5 text-slate-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                                        </svg>
                                        <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest">
                                            อ. {item.amp_name}
                                        </p>
                                    </div>
                                </div>
                            </div>

                            <div className="flex items-center gap-4 pl-4 border-l border-slate-100/50">
                                <div className="text-right flex flex-col items-end">
                                    <div className="flex items-center gap-2">
                                        <div className="flex items-baseline gap-0.5 whitespace-nowrap bg-indigo-50 px-2 py-1 rounded-xl border border-indigo-100">
                                            <span className="text-xl font-black text-indigo-700 tracking-tighter tabular-nums">
                                                {item.current_total.toLocaleString()}
                                            </span>
                                            <span className="text-[10px] font-black text-indigo-400 uppercase">ครั้ง</span>
                                        </div>
                                    </div>
                                    <p className="text-[10px] font-black text-emerald-600 uppercase tracking-widest mt-1 whitespace-nowrap bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-100">
                                        ( {Number(item.performance_percent).toFixed(2)}% )
                                    </p>
                                </div>
                            </div>
                        </motion.div>
                    ))
                )}
            </div>
        </div>
    );

    return (
        <SoftCard className="p-6 md:p-10 overflow-hidden relative border-none shadow-2xl shadow-indigo-100/20 rounded-[2.5rem] bg-white">
            <div className="absolute top-0 right-0 w-96 h-96 bg-indigo-50/50 rounded-full -mr-48 -mt-48 blur-3xl pointer-events-none" />
            <div className="absolute bottom-0 left-0 w-72 h-72 bg-blue-50/30 rounded-full -ml-36 -mb-36 blur-3xl pointer-events-none" />

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 relative z-10">
                {renderList(data.primaryCare, "10 อันดับ รพ.สต./ศูนย์สุขภาพ", "ผลงานแพทย์ทางไกลสูงสุด (TYPE 5)", "bg-emerald-500", data.pcSummary, "ยอดรวมเฉพาะ รพ.สต.")}
                {renderList(data.hospitals, "10 อันดับ โรงพยาบาล", "ผลงานแพทย์ทางไกลสูงสุด (TYPE 5)", "bg-blue-600", data.hospSummary, "ยอดรวมเฉพาะ รพ.")}
            </div>

            <div className="mt-12 flex justify-center">
                <div className="h-1.5 w-16 bg-slate-100 rounded-full" />
            </div>
        </SoftCard>
    );
};

export default TopPerformance;
