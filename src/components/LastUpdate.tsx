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
            <a
                href="https://lookerstudio.google.com/u/0/reporting/33f2a1d7-2f28-43b1-85ea-6cf3e8d579ac/page/p_q5mrcvqeyd"
                target="_blank"
                rel="noopener noreferrer"
                className="group flex items-center gap-2 hover:bg-slate-100 px-3 items-stretch h-[22px] rounded-full transition-all duration-300 cursor-pointer"
            >
                <div className="flex items-center justify-center w-[18px]">
                    <img src="/telemedicine/looker-studio.png" alt="Looker Studio Logo" className="w-[18px] h-[18px] object-contain opacity-80 group-hover:opacity-100 transition-opacity" />
                </div>
                <div className="flex items-center">
                    <span className="font-bold text-slate-500 group-hover:text-slate-700 text-[9px] uppercase tracking-wider transition-colors">Source Telemedicine</span>
                </div>
            </a>

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
