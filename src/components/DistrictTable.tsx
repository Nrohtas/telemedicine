"use client";

import React, { useEffect, useState } from 'react';
import SoftCard from './ui/SoftCard';

interface DistrictStat {
    amp_code: string;
    amp_name: string;
    mohpromt_count: number;
    sornbuddy_count: number;
}

export default function DistrictTable() {
    const [stats, setStats] = useState<DistrictStat[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetch('/api/ampur-stats')
            .then(res => res.json())
            .then(data => {
                setStats(data);
                setLoading(false);
            })
            .catch(err => {
                console.error('Error fetching district stats:', err);
                setLoading(false);
            });
    }, []);

    if (loading) {
        return (
            <div className="flex justify-center items-center h-48">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-nm-primary"></div>
            </div>
        );
    }

    // Find max value for relative progress bars
    const maxVal = Math.max(...stats.map(s => Math.max(s.mohpromt_count, s.sornbuddy_count)), 1);

    return (
        <div className="space-y-8">
            <div className="flex justify-between items-center">
                <h3 className="text-2xl font-black text-nm-primary tracking-tight">สรุปข้อมูลเชิงลึกรายอำเภอ</h3>
                <div className="flex gap-4 text-[10px] font-bold uppercase tracking-widest opacity-60">
                    <div className="flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full bg-[#006837]"></div>
                        หมอพร้อม Station
                    </div>
                    <div className="flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full bg-[#00ADEF]"></div>
                        สอน.บัดดี้
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {stats.map((stat) => (
                    <SoftCard key={stat.amp_code} className="p-6 group hover:scale-[1.02] transition-all duration-500 cursor-default">
                        <div className="flex items-center gap-4 mb-6">
                            <div>
                                <h4 className="font-black text-2xl group-hover:text-nm-primary transition-colors">{stat.amp_name}</h4>
                                <p className="text-xs opacity-50 uppercase font-bold tracking-widest">รหัสอำเภอ: {stat.amp_code}</p>
                            </div>
                        </div>

                        <div className="space-y-5">
                            {/* Mohpromt Bar */}
                            <div className="space-y-3">
                                <div className="flex justify-between items-center text-base font-bold">
                                    <div className="flex items-center gap-4">
                                        <div className="w-12 h-12 rounded-xl nm-card flex items-center justify-center p-1.5">
                                            <svg width="32" height="32" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
                                                <circle cx="50" cy="22" r="14" fill="#006837" />
                                                <path d="M25 40H75V75C75 80 71 84 66 84H34C29 84 25 80 25 75V40Z" stroke="#F6D76E" strokeWidth="10" />
                                                <rect x="40" y="52" width="20" height="7" fill="#A5A7AA" />
                                                <rect x="46.5" y="46" width="7" height="19" fill="#A5A7AA" />
                                            </svg>
                                        </div>
                                        <span className="opacity-60">หมอพร้อม Station</span>
                                    </div>
                                    <span className="text-[#006837] font-black">{stat.mohpromt_count.toLocaleString()} <span className="opacity-50">ราย</span></span>
                                </div>
                                <div className="h-2 w-full nm-inset rounded-full overflow-hidden p-[2px]">
                                    <div
                                        className="h-full bg-[#006837] rounded-full transition-all duration-1000 ease-out"
                                        style={{ width: `${(stat.mohpromt_count / maxVal) * 100}%` }}
                                    ></div>
                                </div>
                            </div>

                            {/* Sorn Buddy Bar */}
                            <div className="space-y-3">
                                <div className="flex justify-between items-center text-base font-bold">
                                    <div className="flex items-center gap-4">
                                        <div className="w-12 h-12 rounded-xl nm-card flex items-center justify-center p-1.5">
                                            <svg width="32" height="32" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
                                                <path d="M10 45L50 15L90 45" stroke="#00ADEF" strokeWidth="12" strokeLinecap="round" />
                                                <rect x="40" y="32" width="20" height="7" fill="#A5A7AA" />
                                                <rect x="46.5" y="26" width="7" height="19" fill="#A5A7AA" />
                                                <path d="M25 55C25 55 25 85 50 85C75 85 75 60 75 60" stroke="#F6D76E" strokeWidth="10" fill="none" strokeLinecap="round" />
                                                <circle cx="75" cy="62" r="8" fill="#0060A9" />
                                            </svg>
                                        </div>
                                        <span className="opacity-60 font-bold">สอน.บัดดี้</span>
                                    </div>
                                    <span className="text-[#00ADEF] font-black">{stat.sornbuddy_count.toLocaleString()} <span className="opacity-50">ราย</span></span>
                                </div>
                                <div className="h-2 w-full nm-inset rounded-full overflow-hidden p-[2px]">
                                    <div
                                        className="h-full bg-[#00ADEF] rounded-full transition-all duration-1000 ease-out"
                                        style={{ width: `${(stat.sornbuddy_count / maxVal) * 100}%` }}
                                    ></div>
                                </div>
                            </div>
                        </div>
                    </SoftCard>
                ))}
            </div>
        </div>
    );
}
