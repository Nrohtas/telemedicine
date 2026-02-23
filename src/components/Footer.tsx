"use client";

import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { formatThaiDate } from '@/utils/date';

const Footer = () => {
    const [isMounted, setIsMounted] = useState(false);
    const [showUpdates, setShowUpdates] = useState(false);
    const [updates, setUpdates] = useState<any[]>([]);

    useEffect(() => {
        setIsMounted(true);
        fetchUpdates();
    }, []);

    const fetchUpdates = async () => {
        try {
            const res = await fetch('/api/updates');
            const data = await res.json();
            if (Array.isArray(data)) {
                setUpdates(data);
            }
        } catch (error) {
            console.error('Failed to fetch updates:', error);
        }
    };

    if (!isMounted) {
        return <footer className="w-full py-6 px-6 mt-auto"></footer>;
    }

    // Get latest version from updates, or fallback to default
    const latestVersion = updates.length > 0 && updates[0].update_version
        ? updates[0].update_version
        : 'V20260222';

    return (
        <>
            <footer className="w-full py-6 px-6 mt-auto">
                <div className="max-w-6xl mx-auto">
                    <div className="flex flex-col md:flex-row items-center justify-between gap-6 border-t border-gray-100 pt-6">
                        <div className="flex items-center gap-3 text-purple-950/70">
                            <p className="text-[11px] font-black uppercase tracking-[0.15em] whitespace-nowrap">
                                © 2026 Phitsanulok Provincial Public Health Office
                            </p>
                        </div>

                        <div className="flex items-center gap-6">
                            <p className="text-[10px] font-black uppercase tracking-[0.3em] text-gray-500 hidden sm:block">
                                <span className="text-[#006837]">MOHPROM STATION</span> <span className="text-gray-500">AND</span> <span className="text-[#00ADEF]">BUDDY CARE</span> <span className="text-gray-500">PLATFORM</span>
                            </p>

                            <button
                                onClick={() => setShowUpdates(true)}
                                className="flex items-center gap-2 transition-colors cursor-pointer group"
                            >
                                <span className="text-[10px] font-black uppercase tracking-widest text-slate-400 group-hover:text-purple-600 transition-colors">
                                    {latestVersion}
                                </span>
                            </button>
                        </div>
                    </div>
                </div>
            </footer>

            {/* System Updates Modal */}
            <AnimatePresence>
                {showUpdates && (
                    <>
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={() => setShowUpdates(false)}
                            className="fixed inset-0 bg-slate-900/20 backdrop-blur-sm z-50"
                        />
                        <motion.div
                            initial={{ opacity: 0, y: 100, scale: 0.95 }}
                            animate={{ opacity: 1, y: 0, scale: 1 }}
                            exit={{ opacity: 0, y: 100, scale: 0.95 }}
                            className="fixed bottom-6 right-6 md:bottom-12 md:right-12 w-full max-w-sm bg-white rounded-[2rem] shadow-2xl z-50 overflow-hidden border border-slate-100 flex flex-col max-h-[70vh]"
                        >
                            <div className="p-6 border-b border-slate-50 bg-slate-50/50 flex items-center justify-between shrink-0">
                                <div className="flex items-center gap-3">
                                    <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-purple-600 to-blue-500 text-white flex items-center justify-center shadow-lg shadow-purple-500/30">
                                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 7v6m-3-3h6" />
                                        </svg>
                                    </div>
                                    <h3 className="text-sm font-black text-slate-800 tracking-tight">System Update</h3>
                                </div>
                                <button
                                    onClick={() => setShowUpdates(false)}
                                    className="p-2 bg-white hover:bg-slate-100 text-slate-400 rounded-full transition-colors shadow-sm"
                                >
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                    </svg>
                                </button>
                            </div>

                            <div className="p-6 overflow-y-auto space-y-6 flex-1 custom-scrollbar">
                                {updates.length > 0 ? (
                                    updates.slice(0, 5).map((upd, idx) => (
                                        <motion.div
                                            key={upd.update_id}
                                            initial={{ opacity: 0, x: -20 }}
                                            animate={{ opacity: 1, x: 0 }}
                                            transition={{ delay: idx * 0.1 }}
                                            className="relative pl-6 pb-6 border-l-[3px] border-slate-100 last:border-transparent last:pb-0"
                                        >
                                            <div className="absolute left-[-9px] top-0 w-4 h-4 rounded-full bg-white border-[3px] border-purple-400 shadow-sm" />
                                            <div className="flex items-center gap-2 mb-2">
                                                <p className="text-xs font-black tracking-wider text-purple-700">
                                                    {formatThaiDate(upd.update_created)}
                                                </p>
                                                {upd.update_version && (
                                                    <span className="text-[9px] px-2 py-0.5 rounded-full font-bold uppercase tracking-widest border bg-purple-50 text-purple-600 border-purple-100">
                                                        {upd.update_version}
                                                    </span>
                                                )}
                                                {idx === 0 && (
                                                    <span className="flex items-center gap-1 text-[9px] bg-blue-50 text-blue-600 px-2 py-0.5 rounded-full font-bold uppercase tracking-widest border border-blue-100 animate-pulse">
                                                        <span className="w-1.5 h-1.5 rounded-full bg-blue-500"></span>
                                                        LATEST
                                                    </span>
                                                )}
                                            </div>
                                            <p className="text-sm text-slate-600 leading-relaxed font-medium">
                                                {upd.update_description}
                                            </p>
                                        </motion.div>
                                    ))
                                ) : (
                                    <div className="text-center py-8">
                                        <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">ไม่มีข้อมูลการอัปเดต</p>
                                    </div>
                                )}
                            </div>
                        </motion.div>
                    </>
                )}
            </AnimatePresence>
        </>
    );
};

export default Footer;
