"use client";

import React, { useState, useEffect } from "react";
import { formatThaiDate, formatThaiDateOnly } from "@/utils/date";

interface LastUpdateProps {
    showLogo?: boolean;
    type?: string;
    sourceLink?: string;
    sourceLabel?: string;
    className?: string;
}

export default function LastUpdate({ showLogo = true, type, sourceLink, sourceLabel, className = "mb-2 md:mb-1" }: LastUpdateProps) {
    const [lastUpdate, setLastUpdate] = useState<string | null>(null);

    useEffect(() => {
        const url = type ? `/telemedicine/api/last-update?type=${type}` : '/telemedicine/api/last-update';
        fetch(url)
            .then(res => res.json())
            .then(data => {
                if (data.lastUpdate) {
                    setLastUpdate(data.lastUpdate);
                }
            })
            .catch(err => console.error('Error fetching last update:', err));
    }, [type]);

    if (!lastUpdate) return null;

    return (
        <div className={`flex flex-col sm:flex-row items-center sm:items-center gap-1.5 sm:gap-4 ${className}`}>
            {showLogo && (
                <a
                    href="https://lookerstudio.google.com/u/0/reporting/33f2a1d7-2f28-43b1-85ea-6cf3e8d579ac/page/p_q5mrcvqeyd"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="group flex items-center justify-center w-8 h-8 hover:bg-slate-100 rounded-full transition-all duration-300 cursor-pointer"
                >
                    <img src="/telemedicine/looker-studio.png" alt="Looker Studio Logo" className="w-5 h-5 object-contain opacity-80 group-hover:opacity-100 transition-opacity" />
                </a>
            )}

            <div className="flex items-center gap-1.5 px-3 sm:px-0 text-center sm:text-left">
                <span className="relative flex h-1.5 w-1.5 shrink-0">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-800 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-blue-800"></span>
                </span>
                <span className="text-[10px] font-bold text-slate-400/80 tracking-wider whitespace-nowrap">
                    {sourceLink && sourceLabel ? (
                         <span className="mr-3 pr-3 border-r border-slate-200">
                         ที่มา : <a 
                             href={sourceLink}
                             target="_blank" 
                             rel="noopener noreferrer"
                             className="hover:text-blue-800 transition-colors"
                         >
                             {sourceLabel}
                         </a>
                     </span>
                    ) : !type && (
                        <span className="mr-3 pr-3 border-r border-slate-200">
                            ที่มา : <a 
                                href="https://lookerstudio.google.com/u/0/reporting/33f2a1d7-2f28-43b1-85ea-6cf3e8d579ac/page/p_q5mrcvqeyd" 
                                target="_blank" 
                                rel="noopener noreferrer"
                                className="hover:text-blue-800 transition-colors"
                            >
                                กองสนับสนุนระบบสุขภาพปฐมภูมิ
                            </a>
                        </span>
                    )}
                    Update : {type === 'daily' ? formatThaiDate(lastUpdate) : formatThaiDateOnly(lastUpdate)}
                </span>
            </div>
        </div>
    );
}
