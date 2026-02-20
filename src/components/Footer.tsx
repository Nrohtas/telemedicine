"use client";

import React from 'react';

const Footer = () => {
    return (
        <footer className="w-full py-6 px-6 mt-auto">
            <div className="max-w-6xl mx-auto">
                <div className="flex flex-col md:flex-row items-center justify-between gap-6 border-t border-gray-100 pt-6">
                    <div className="flex items-center gap-3">
                        <div className="w-1.5 h-1.5 rounded-full bg-purple-900/30"></div>
                        <p className="text-[11px] font-black text-purple-950/70 uppercase tracking-[0.15em] whitespace-nowrap">
                            © 2026 Phitsanulok Provincial Public Health Office
                        </p>
                    </div>

                    <div className="flex items-center gap-6">
                        <p className="text-[10px] font-black uppercase tracking-[0.3em] text-gray-500 hidden sm:block">
                            <span className="text-[#006837]">MOHPROM STATION</span> <span className="text-gray-500">AND</span> <span className="text-[#00ADEF]">BUDDY CARE</span> <span className="text-gray-500">PLATFORM</span>
                        </p>
                        <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-gray-50 border border-gray-100">
                            <div className="w-1 h-1 rounded-full bg-emerald-500"></div>
                            <span className="text-[9px] font-black uppercase tracking-widest text-gray-400">v3.0.4 Online</span>
                        </div>
                    </div>
                </div>
            </div>
        </footer>
    );
};

export default Footer;
