"use client";

import React, { useState } from "react";
import Link from "next/link";
import Navbar from "@/components/Navbar";
import SoftCard from "@/components/ui/SoftCard";
import SoftButton from "@/components/ui/SoftButton";
import DistrictTable from "@/components/DistrictTable";
import Footer from "@/components/Footer";
import LastUpdate from "@/components/LastUpdate";

export default function Home() {
  const [selectedDistrict, setSelectedDistrict] = useState("เลือกอำเภอ");
  const [globalStats, setGlobalStats] = useState({
    total_services: 0,
    total_result_past: 0,
    total_hospitals: 0,
    total_moph: 0,
    total_buddycare: 0,
    last_update_date: null,
    prev_update_date: null,
  });
  const [targetData, setTargetData] = useState({
    total_result: 0,
    target: 0,
    target_2: 0,
    target_4: 0,
    target_8: 0,
    target_10: 0,
    target_30: 0
  });


  React.useEffect(() => {
    const fetchGlobalStats = async () => {
      try {
        const response = await fetch('/telemedicine/api/global-stats', { cache: 'no-store' });
        const data = await response.json();
        if (!data.error) {
          setGlobalStats(data);
        }
      } catch (err) {
        console.error('Error fetching global stats:', err);
      }
    };

    const fetchTargetData = async () => {
      try {
        console.log('Fetching target data...');
        const response = await fetch('/telemedicine/api/target', { cache: 'no-store' });
        console.log('Target response status:', response.status);
        const data = await response.json();
        console.log('Target data received:', data);
        if (!data.error) {
          setTargetData(data);
        } else {
          console.error('Target API returned an error:', data.error);
        }
      } catch (err) {
        console.error('Error fetching target data:', err);
      }
    };

    fetchGlobalStats();
    fetchTargetData();
  }, []);
  const formatDateThai = (dateStr: string | null) => {
    if (!dateStr) return "-";
    const date = new Date(dateStr);
    return date.toLocaleDateString("th-TH", {
      day: "numeric",
      month: "short",
      year: "2-digit",
    });
  };

  const stats: { label: string; value: string; unit: string; trend: string; color: string; icon: React.ReactNode; href?: string }[] = [
    {
      label: "หมอพร้อม STATION",
      value: globalStats.total_moph.toLocaleString(),
      unit: "ครั้ง",
      trend: "-2%",
      color: "text-[#006837]",
      icon: (
        <svg width="24" height="24" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
          <circle cx="50" cy="22" r="14" fill="#006837" />
          <path d="M25 40H75V75C75 80 71 84 66 84H34C29 84 25 80 25 75V40Z" stroke="#F6D76E" strokeWidth="10" />
          <rect x="40" y="52" width="20" height="7" fill="#A5A7AA" />
          <rect x="46.5" y="46" width="7" height="19" fill="#A5A7AA" />
        </svg>
      )
    },
    {
      label: "สอน.บัดดี้",
      value: globalStats.total_buddycare.toLocaleString(),
      unit: "ครั้ง",
      trend: "+1%",
      color: "text-[#00ADEF]",
      icon: (
        <svg width="24" height="24" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M10 45L50 15L90 45" stroke="#00ADEF" strokeWidth="12" strokeLinecap="round" />
          <rect x="40" y="32" width="20" height="7" fill="#A5A7AA" />
          <rect x="46.5" y="26" width="7" height="19" fill="#A5A7AA" />
          <path d="M25 55C25 55 25 85 50 85C75 85 75 60 75 60" stroke="#F6D76E" strokeWidth="10" fill="none" strokeLinecap="round" />
          <circle cx="75" cy="62" r="8" fill="#0060A9" />
        </svg>
      )
    },
  ];

  return (
    <main className="min-h-screen pb-12 bg-background">
      <Navbar
        selectedDistrict={selectedDistrict}
        onDistrictChange={setSelectedDistrict}
        searchValue=""
        onSearchChange={() => { }}
      />

      <div className="px-6 grid grid-cols-1 lg:grid-cols-12 gap-8 mt-8">
        {/* Stats Section Header */}
        <div className="lg:col-span-12 flex justify-between items-end mb-[-16px]">
          <h3 className="text-2xl font-black text-nm-primary tracking-tight">ภาพรวมจังหวัด</h3>
          <LastUpdate />
        </div>

        {/* Stats Section Cards (Top Row: Integrated Overview) */}
        <div className="lg:col-span-12 grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
          {/* Main Column: Unified Performance Dashboard (Ultra-Compact Mode) */}
          <div className="lg:col-span-8">
            <SoftCard className="p-4 h-full group transition-all duration-500 shadow-2xl border-t-4 border-red-500 bg-white/95 backdrop-blur-xl relative overflow-hidden flex flex-col justify-between">
              {/* Subtle Gradient Background */}
              <div className="absolute inset-0 bg-gradient-to-br from-red-50/20 to-transparent opacity-50" />

              <div className="relative z-10 space-y-3">
                {/* Header: Identity & Comparison Inline */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-xl bg-red-500 text-white shadow-xl shadow-red-200 ring-4 ring-red-50">
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                        <rect x="2" y="3" width="20" height="14" rx="2" ry="2" />
                        <line x1="8" y1="21" x2="16" y2="21" />
                        <line x1="12" y1="17" x2="12" y2="21" />
                      </svg>
                    </div>
                    <div>
                      <h3 className="text-lg font-black text-red-600 tracking-tighter">การให้บริการการแพทย์ทางไกล</h3>
                    </div>
                  </div>
                </div>

                {/* Body Content: Volume | Gaps | Achievement */}
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-3 items-stretch">
                  {/* Section 1: Volume Comparison Scale (Left - 50% width) */}
                  <div className="lg:col-span-6 space-y-3 px-4 flex flex-col justify-center border-r-0 lg:border-r border-gray-100">
                    <div className="text-[9px] font-black text-slate-500 uppercase tracking-[0.25em]">ความคืบหน้าผลงาน</div>

                    <div className="flex items-center justify-between">
                      {/* Previous Results Group */}
                      <div className="flex flex-col items-start gap-1">
                        <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest leading-none whitespace-nowrap">ผลงาน ({formatDateThai(globalStats.prev_update_date)})</span>
                        <div className="flex items-baseline gap-1">
                          <span className="text-2xl font-black text-gray-500 tracking-tighter leading-none">{globalStats.total_result_past.toLocaleString()}</span>
                          <span className="text-[8px] font-bold text-gray-400 uppercase tracking-widest leading-none">ครั้ง</span>
                        </div>
                      </div>

                      {/* Current Highlight Group */}
                      <div className="flex flex-col items-end gap-1 text-right">
                        <span className="text-[10px] font-black text-indigo-500 uppercase tracking-widest leading-none whitespace-nowrap">ผลงาน ({formatDateThai(globalStats.last_update_date)})</span>
                        <div className="flex items-baseline gap-2">
                          {/* Difference Badge */}
                          {globalStats.total_services !== globalStats.total_result_past && (
                            <div className={`px-2 py-0.5 rounded-full text-[10px] font-black border leading-none ${globalStats.total_services > globalStats.total_result_past ? 'bg-emerald-50 text-emerald-600 border-emerald-200' : 'bg-rose-50 text-rose-600 border-rose-200'}`}>
                              {globalStats.total_services > globalStats.total_result_past ? '+' : '-'}{Math.abs(globalStats.total_services - globalStats.total_result_past).toLocaleString()}
                            </div>
                          )}
                          <span className="text-4xl font-black text-indigo-700 tracking-tighter leading-none">{globalStats.total_services.toLocaleString()}</span>
                          <span className="text-[9px] font-bold text-indigo-600 uppercase tracking-widest leading-none">ครั้ง</span>
                        </div>
                      </div>
                    </div>

                    <div className="h-2 w-full bg-gray-100 rounded-full overflow-hidden relative shadow-inner ring-1 ring-white/50">
                      <div
                        className="absolute h-full bg-gray-200 transition-all duration-1000 ease-out"
                        style={{ width: `${globalStats.total_services > 0 ? (globalStats.total_result_past / globalStats.total_services) * 100 : 0}%` }}
                      />
                      <div
                        className="absolute h-full bg-gradient-to-r from-indigo-500 to-indigo-600 transition-all duration-1000 ease-out"
                        style={{
                          left: `${globalStats.total_services > 0 ? (globalStats.total_result_past / globalStats.total_services) * 100 : 0}%`,
                          width: `${globalStats.total_services > 0 ? (100 - (globalStats.total_result_past / globalStats.total_services) * 100) : 0}%`
                        }}
                      />
                    </div>
                  </div>

                  {/* Section 2: Goals & Missing Volume (Center - 33% width) */}
                  <div className="lg:col-span-4 space-y-3 bg-gradient-to-br from-red-50/50 to-orange-50/20 p-3.5 rounded-2xl border border-red-100/50 flex flex-col justify-center shadow-sm">
                    <div className="flex flex-col gap-2">
                      {(() => {
                        const displayTarget = Math.round(targetData.target_30);
                        const missing = Math.max(0, displayTarget - globalStats.total_services);
                        return (
                          <>
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-1.5">
                                <div className="p-1 rounded bg-red-100/50 text-[#FF6B6B]">
                                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                                    <path d="M22 12h-4l-3 9L9 3l-3 9H2" />
                                  </svg>
                                </div>
                                <div className="text-[10px] font-black text-[#FF6B6B] uppercase tracking-[0.2em] leading-none text-left">ผลงานขาดอีก</div>
                              </div>
                              <div className="flex items-baseline gap-1">
                                <span className="text-2xl font-black text-[#FF6B6B] tracking-tight leading-none">{missing.toLocaleString()}</span>
                                <span className="text-[10px] font-bold text-[#FF6B6B]/70 uppercase tracking-widest leading-none">ครั้ง</span>
                              </div>
                            </div>

                            <div className="h-[0.5px] w-full bg-red-200/30" />

                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-1.5">
                                <div className="p-1 rounded bg-red-100 text-red-600">
                                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                                    <circle cx="12" cy="12" r="10" />
                                    <circle cx="12" cy="12" r="6" />
                                    <circle cx="12" cy="12" r="2" />
                                  </svg>
                                </div>
                                <div className="text-[10px] font-black text-red-600 uppercase tracking-[0.2em] leading-none text-left">เป้าหมาย (30%)</div>
                              </div>
                              <div className="flex items-baseline gap-1">
                                <span className="text-2xl font-black text-red-700 tracking-tight leading-none">{displayTarget.toLocaleString()}</span>
                                <span className="text-[10px] font-bold text-red-600/70 uppercase tracking-widest leading-none">ครั้ง</span>
                              </div>
                            </div>
                          </>
                        );
                      })()}
                    </div>

                    <div className="h-1.5 w-full bg-red-100/20 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-red-500/60 transition-all duration-1000 ease-out"
                        style={{ width: `${targetData.target_30 > 0 ? Math.min((globalStats.total_services / targetData.target_30) * 100, 100) : 0}%` }}
                      />
                    </div>
                  </div>

                  {/* Section 3: Achievement KPI (Right - 17% width) */}
                  <div className="lg:col-span-2 bg-gradient-to-br from-teal-50 to-emerald-100 p-3 rounded-2xl text-emerald-900 shadow-sm flex flex-col justify-center items-center relative overflow-hidden border border-emerald-200/50">
                    <div className="absolute top-0 right-0 -mr-4 -mt-4 w-12 h-12 bg-white/40 rounded-full blur-xl" />
                    <div className="text-[9px] font-black uppercase tracking-[0.15em] text-emerald-600/80 mb-1 text-center whitespace-nowrap">คิดเป็นผลงาน</div>
                    <div className="text-3xl font-black tracking-tighter leading-none text-emerald-700">
                      {targetData.target_30 > 0 ? ((globalStats.total_services / targetData.target_30) * 100).toFixed(1) : 0}%
                    </div>
                  </div>
                </div>
              </div>
            </SoftCard>
          </div>

          {/* Secondary Column: Provder Stack */}
          <div className="lg:col-span-4 flex flex-col gap-3">
            {/* Card 2: MOPH STATION */}
            <SoftCard className="p-3 h-full group transition-all duration-300 shadow-xl border-t-2 border-[#006837] flex flex-col justify-center">
              <div className="flex justify-between items-center mb-2">
                <div className="flex items-center gap-2">
                  <div className="p-2 rounded-lg bg-emerald-50 text-[#006837] shadow-inner ring-2 ring-emerald-50/50">
                    <svg width="18" height="18" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <circle cx="50" cy="22" r="14" fill="#006837" />
                      <path d="M25 40H75V75C75 80 71 84 66 84H34C29 84 25 80 25 75V40Z" stroke="#F6D76E" strokeWidth="10" />
                      <rect x="40" y="52" width="20" height="7" fill="#A5A7AA" />
                      <rect x="46.5" y="46" width="7" height="19" fill="#A5A7AA" />
                    </svg>
                  </div>
                  <span className="text-[9px] font-black uppercase tracking-[0.2em] text-[#006837]">หมอพร้อม STATION</span>
                </div>
              </div>
              <div className="flex flex-col gap-0.5">
                <div className="flex items-baseline gap-1.5">
                  <span className="text-3xl font-black tracking-tighter text-[#006837] leading-none">{globalStats.total_moph.toLocaleString()}</span>
                  <span className="text-[9px] font-bold text-[#006837]/60 uppercase tracking-widest">ครั้ง</span>
                </div>
                <div className="text-[9px] font-bold text-gray-400 uppercase tracking-widest mt-0.5 block">หน่วยงานหลัก</div>
              </div>
            </SoftCard>

            {/* Card 3: SORN BUDDY */}
            <SoftCard className="p-3 h-full group transition-all duration-300 shadow-xl border-t-2 border-[#00ADEF] flex flex-col justify-center">
              <div className="flex justify-between items-center mb-2">
                <div className="flex items-center gap-2">
                  <div className="p-2 rounded-lg bg-sky-50 text-[#00ADEF] shadow-inner ring-2 ring-sky-50/50">
                    <svg width="18" height="18" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path d="M10 45L50 15L90 45" stroke="#00ADEF" strokeWidth="12" strokeLinecap="round" />
                      <rect x="40" y="32" width="20" height="7" fill="#A5A7AA" />
                      <rect x="46.5" y="26" width="7" height="19" fill="#A5A7AA" />
                      <path d="M25 55C25 55 25 85 50 85C75 85 75 60 75 60" stroke="#F6D76E" strokeWidth="10" fill="none" strokeLinecap="round" />
                      <circle cx="75" cy="62" r="8" fill="#0060A9" />
                    </svg>
                  </div>
                  <span className="text-[9px] font-black uppercase tracking-[0.2em] text-[#00ADEF]">สอน.บัดดี้</span>
                </div>
              </div>
              <div className="flex flex-col gap-0.5">
                <div className="flex items-baseline gap-1.5">
                  <span className="text-3xl font-black tracking-tighter text-[#00ADEF] leading-none">{globalStats.total_buddycare.toLocaleString()}</span>
                  <span className="text-[9px] font-bold text-[#00ADEF]/60 uppercase tracking-widest">ครั้ง</span>
                </div>
                <div className="text-[9px] font-bold text-gray-400 uppercase tracking-widest mt-0.5 block">สอน.บัดดี้</div>
              </div>
            </SoftCard>
          </div>
        </div>

        {/* District Stats Section */}
        <div className="lg:col-span-12">
          <DistrictTable />
        </div>
      </div>
      <Footer />
    </main>
  );
}
