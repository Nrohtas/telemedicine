"use client";

import React, { useState, useEffect } from "react";
import { formatThaiDate } from "@/utils/date";

export default function LastUpdate() {
    const [lastUpdate, setLastUpdate] = useState<string | null>(null);

    useEffect(() => {
        fetch('/api/last-update')
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
                className="flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-blue-50/50 hover:bg-blue-100/50 border border-blue-100 hover:border-blue-200 transition-colors cursor-pointer group"
            >
                <img
                    src="/logo-moph.png"
                    alt="MOPH Logo"
                    className="h-3 w-3 object-contain"
                />
                <span className="text-[9px] font-bold text-blue-600 group-hover:text-blue-700 transition-colors whitespace-nowrap">
                    Source: Telemedicine Data
                </span>
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
