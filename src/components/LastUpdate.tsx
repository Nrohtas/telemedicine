"use client";

import React, { useState, useEffect } from "react";
import { formatThaiDate } from "@/utils/date";

export default function LastUpdate() {
    const [lastUpdate, setLastUpdate] = useState<string | null>(null);

    useEffect(() => {
        fetch('/telemedicine/api/last-update')
            .then(res => res.json())
            .then(data => {
                if (data.lastUpdate) {
                    setLastUpdate(data.lastUpdate);
                }
            })
            .catch(err => console.error('Error fetching last update:', err));
    }, []);

    if (!lastUpdate) return null;

    return (
        <div className="flex items-center gap-3 mb-1">
            <div className="flex items-center gap-2 bg-gradient-to-r from-teal-50 to-emerald-50 px-4 items-stretch h-[22px] border border-teal-100 rounded-full shadow-[0_2px_10px_-4px_rgba(20,184,166,0.2)] hover:shadow-[0_4px_12px_-4px_rgba(20,184,166,0.3)] transition-all duration-300">
                <div className="flex items-center justify-center w-[18px]">
                    <img src="/telemedicine/logo-moph.png" alt="MOPH Logo" className="w-[18px] h-[18px] object-contain" />
                </div>
                <div className="flex items-center border-l border-teal-200/50 pl-2">
                    <span className="font-bold text-[#059669] text-[9px] uppercase tracking-wider">Source : สสจ.พิษณุโลก</span>
                </div>
            </div>

            <span className="text-[10px] font-bold text-slate-400/80 uppercase tracking-wider flex items-center gap-1.5">
                <span className="relative flex h-1.5 w-1.5">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-800 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-blue-800"></span>
                </span>
                Last Update: {formatThaiDate(lastUpdate)}
            </span>
        </div>
    );
}
