"use client";

import React, { useEffect, useState } from 'react';
import SoftCard from './ui/SoftCard';
import { motion } from 'framer-motion';

interface Improver {
    hospcode: string;
    hospname: string;
    amp_name: string;
    hostype_label: string;
    affiliation: string;
    current_total: number;
    past_total: number;
    increase: number;
}

const TopImprovers = () => {
    const [improvers, setImprovers] = useState<Improver[]>([]);
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
        const fetchImprovers = async () => {
            try {
                // Using relative path for robustness across environments
                const res = await fetch('/telemedicine/api/top-improvers', { cache: 'no-store' });
                if (!res.ok) throw new Error('Fetch failed');
                const data = await res.json();
                if (Array.isArray(data)) {
                    setImprovers(data);
                }
            } catch (error) {
                console.error('Failed to fetch top improvers:', error);
            } finally {
                setIsLoading(false);
            }
        };

        fetchImprovers();
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

    if (improvers.length === 0) return null;

    return (
        <SoftCard className="p-6 md:p-8 overflow-hidden relative border-none shadow-2xl shadow-emerald-100/20 rounded-[2.5rem] bg-white">
            {/* Background Decorative Blob */}
            <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-50/50 rounded-full -mr-32 -mt-32 blur-3xl pointer-events-none" />
            <div className="absolute bottom-0 left-0 w-48 h-48 bg-teal-50/30 rounded-full -ml-24 -mb-24 blur-3xl pointer-events-none" />

            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-10 relative z-10">
                <div className="flex items-center gap-4">
                    <div className="p-3 rounded-2xl bg-emerald-500 text-white shadow-lg shadow-emerald-200 ring-4 ring-emerald-50">
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                            <polyline points="23 6 13.5 15.5 8.5 10.5 1 18" />
                            <polyline points="17 6 23 6 23 12" />
                        </svg>
                    </div>
                    <div className="flex flex-col">
                        <h2 className="text-lg md:text-xl font-black text-blue-700 tracking-tight leading-none">10 อันดับ หน่วยบริการประจำสัปดาห์</h2>
                        <p className="text-[10px] md:text-xs font-black text-emerald-600 uppercase tracking-[0.27em] mt-2 opacity-80 text-justify">ที่ให้บริการแพทย์ทางไกลมากที่สุด</p>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 relative z-10">
                {improvers.map((item, idx) => (
                    <motion.div
                        key={item.hospcode}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: idx * 0.05 }}
                        className="flex items-center justify-between p-3 bg-slate-50/50 border border-white rounded-[1.25rem] hover:bg-white hover:shadow-xl hover:shadow-emerald-500/10 transition-all duration-300 group"
                    >
                        <div className="flex items-center gap-4 overflow-hidden">
                            <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-black text-xs shrink-0 transition-all duration-300 group-hover:scale-110 shadow-sm border ${idx === 0 ? 'bg-gradient-to-br from-yellow-300 to-amber-500 text-amber-950 border-amber-200 shadow-amber-100' :
                                idx === 1 ? 'bg-gradient-to-br from-slate-100 to-slate-300 text-slate-700 border-slate-200 shadow-slate-100' :
                                    idx === 2 ? 'bg-gradient-to-br from-orange-200 to-amber-600 text-amber-950 border-orange-200 shadow-orange-100' :
                                        'bg-slate-50/80 text-slate-500 border-slate-100 group-hover:bg-indigo-600 group-hover:text-white'
                                }`}>
                                {idx + 1}
                            </div>
                            <div className="min-w-0">
                                <h3 className={`text-[11px] font-black truncate transition-colors whitespace-nowrap overflow-hidden text-ellipsis max-w-[180px] md:max-w-none ${getAffiliationColor(item.affiliation)}`}>
                                    {item.hospname.replace('โรงพยาบาลส่งเสริมสุขภาพตำบล', 'รพ.สต.').replace('โรงพยาบาล', 'รพ.')} ({item.hospcode})
                                </h3>
                                <div className="flex items-center gap-1.5 mt-1">
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 text-slate-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                                    </svg>
                                    <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">
                                        อ. {item.amp_name}
                                    </p>
                                </div>
                            </div>
                        </div>

                        <div className="flex items-center gap-6 pl-6 border-l border-slate-100">
                            <div className="text-right flex flex-col items-end">
                                <div className="flex items-center gap-3">
                                    {/* Increase Badge (Now First) */}
                                    <div className="flex items-center gap-1 text-emerald-600 font-bold bg-emerald-50 px-2 py-1 rounded-lg border border-emerald-100/50 shrink-0">
                                        <span className="text-xs tracking-tight">+{item.increase.toLocaleString()}</span>
                                    </div>
                                    {/* Total Results (Now Second) */}
                                    <div className="flex items-baseline gap-1 whitespace-nowrap">
                                        <span className="text-xl font-black text-indigo-700 tracking-tighter tabular-nums">
                                            {item.current_total.toLocaleString()}
                                        </span>
                                        <span className="text-[9px] font-bold text-slate-400 uppercase">ครั้ง</span>
                                    </div>
                                </div>
                                <p className="text-[8px] font-black text-indigo-700 uppercase tracking-widest mt-1">ผลงานล่าสุด</p>
                            </div>
                        </div>
                    </motion.div>
                ))}
            </div>

            {/* Footer indicator matching dashboard style */}
            <div className="mt-8 flex justify-center">
                <div className="h-1 w-12 bg-slate-100 rounded-full" />
            </div>
        </SoftCard>
    );
};

export default TopImprovers;
