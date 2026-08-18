"use client";

import React, { useState } from "react";
import Link from "next/link";
import Navbar from "@/components/Navbar";
import SoftCard from "@/components/ui/SoftCard";
import SoftButton from "@/components/ui/SoftButton";
import DistrictTable from "@/components/DistrictTable";
import Footer from "@/components/Footer";
import LastUpdate from "@/components/LastUpdate";
import CircularProgress from "@/components/ui/CircularProgress";
import LiquidProgress from "@/components/ui/LiquidProgress";
import TopImprovers from "@/components/TopImprovers";

export default function Home() {
  const [selectedDistrict, setSelectedDistrict] = useState("เลือกอำเภอ");
  const [globalStats, setGlobalStats] = useState({
    total_services: 0,
    total_result_past: 0,
    total_hospitals: 0,
    total_moph: 0,
    total_moph_past: 0,
    total_buddycare: 0,
    total_buddycare_past: 0,
    total_hdc: 0,
    total_hdc_past: 0,
    total_healthconnex: 0,
    total_healthconnex_past: 0,
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
      year: "numeric",
      calendar: 'buddhist'
    } as any);
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
    {
      label: "HDC",
      value: globalStats.total_hdc.toLocaleString(),
      unit: "ครั้ง",
      trend: "+0%",
      color: "text-[#7C3AED]",
      icon: (
        <svg width="24" height="24" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
          <text x="50" y="55" dominantBaseline="middle" textAnchor="middle" fill="#7C3AED" fontWeight="900" fontSize="36" fontFamily="Inter, sans-serif">H</text>
          <path d="M20 75H80" stroke="#F6D76E" strokeWidth="8" strokeLinecap="round" />
        </svg>
      )
    },
    {
      label: "Health Connex",
      value: globalStats.total_healthconnex.toLocaleString(),
      unit: "ครั้ง",
      trend: "+0%",
      color: "text-[#FF6B6B]",
      icon: (
        <svg width="24" height="24" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
          <text x="50" y="55" dominantBaseline="middle" textAnchor="middle" fill="#FF6B6B" fontWeight="900" fontSize="36" fontFamily="Inter, sans-serif">H</text>
          <path d="M15 50H85M50 15V85" stroke="#F6D76E" strokeWidth="8" strokeLinecap="round" />
        </svg>
      )
    }
  ];

  return (
    <main className="min-h-screen flex flex-col bg-background">
      <Navbar
        selectedDistrict={selectedDistrict}
        onDistrictChange={setSelectedDistrict}
        searchValue=""
        onSearchChange={() => { }}
      />

      <div className="px-6 grid grid-cols-1 lg:grid-cols-12 gap-8 mt-8">
        {/* Stats Section Header */}
        <div className="lg:col-span-12 flex flex-col sm:flex-row justify-between items-start sm:items-end gap-3 sm:gap-0 mb-[-8px] sm:mb-[-16px]">
          <h3 className="text-xl sm:text-2xl font-black text-[#1E1B4B] tracking-tight">ภาพรวมจังหวัด</h3>
          <LastUpdate />
        </div>

        {/* Stats Section Cards (Top Row: Integrated Overview) */}
        <div className="lg:col-span-12 grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
          {/* Main Column: Unified Performance Dashboard (Ultra-Compact Mode) */}
          <div className="lg:col-span-8">
            <SoftCard className="p-4 h-full group transition-all duration-500 shadow-2xl border-t-4 border-indigo-600 bg-white/95 backdrop-blur-xl relative overflow-hidden flex flex-col justify-between">
              {/* Subtle Gradient Background */}
              <div className="absolute inset-0 bg-gradient-to-br from-indigo-50/20 to-transparent opacity-50" />

              <div className="relative z-10 space-y-3">
                {/* Header: Identity & Comparison Inline */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-xl bg-indigo-600 text-white shadow-xl shadow-indigo-200 ring-4 ring-indigo-50">
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                        <rect x="2" y="3" width="20" height="14" rx="2" ry="2" />
                        <line x1="8" y1="21" x2="16" y2="21" />
                        <line x1="12" y1="17" x2="12" y2="21" />
                      </svg>
                    </div>
                    <div>
                      <h3 className="text-lg font-black text-indigo-900 tracking-tighter">การให้บริการแพทย์ทางไกล</h3>
                    </div>
                  </div>
                </div>

                {/* Body Content: Volume | Gaps | Achievement */}
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-3 items-stretch">
                  {/* Section 1: Volume Comparison Scale (Left - Expanded to 6 cols) */}
                  <div className="lg:col-span-6 space-y-4 px-5 flex flex-col justify-center border-r-0 lg:border-r border-gray-100">
                    <div className="text-[9px] font-black text-slate-500 uppercase tracking-[0.25em]">ความก้าวหน้าผลงาน</div>

                    <div className="flex items-center justify-between">
                      {/* Previous Results Group */}
                      <div className="flex flex-col items-start gap-0.5">
                        <span className="text-[8px] sm:text-[10px] font-black text-gray-400 uppercase tracking-widest leading-tight">ผลงานครั้งก่อน<br className="sm:hidden" />({formatDateThai(globalStats.prev_update_date)})</span>
                        <div className="flex items-baseline gap-1">
                          <span className="text-lg sm:text-xl font-black text-gray-500 tracking-tighter leading-none">{globalStats.total_result_past.toLocaleString()}</span>
                          <span className="text-[7px] sm:text-[8px] font-bold text-gray-400 uppercase tracking-widest leading-none">ครั้ง</span>
                        </div>
                      </div>

                      {/* Current Highlight Group */}
                      <div className="flex flex-col items-end gap-1 text-right">
                        <span className="text-[9px] sm:text-[11px] font-black text-indigo-500/80 uppercase tracking-widest leading-none">
                          ผลงานล่าสุด ({formatDateThai(globalStats.last_update_date)})
                        </span>
                        <div className="flex items-center gap-3">
                          {/* Difference Badge - Improved placement */}
                          {globalStats.total_services !== globalStats.total_result_past && (
                            <div className={`px-2.5 py-1 rounded-lg text-[13px] font-black border shadow-sm ${globalStats.total_services > globalStats.total_result_past ? 'bg-emerald-50 text-emerald-600 border-emerald-200' : 'bg-rose-50 text-rose-600 border-rose-200'}`}>
                              {globalStats.total_services > globalStats.total_result_past ? '+' : '-'}{Math.abs(globalStats.total_services - globalStats.total_result_past).toLocaleString()}
                            </div>
                          )}
                          <div className="flex items-baseline gap-1.5">
                            <span className="text-4xl sm:text-5xl font-black text-indigo-800 tracking-tighter leading-none">
                              {globalStats.total_services.toLocaleString()}
                            </span>
                            <span className="text-[10px] sm:text-[12px] font-black text-indigo-400 uppercase tracking-widest leading-none">ครั้ง</span>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="h-2 w-full bg-gray-100 rounded-full overflow-hidden relative shadow-inner ring-1 ring-white/50">
                      <div
                        className="absolute h-full bg-gray-200 transition-all duration-1000 ease-out"
                        style={{ width: `${globalStats.total_services > 0 ? (globalStats.total_result_past / globalStats.total_services) * 100 : 0}%` }}
                      />
                      <div
                        className="absolute h-full bg-gradient-to-r from-emerald-500 to-emerald-600 transition-all duration-1000 ease-out shadow-[0_0_8px_rgba(16,185,129,0.2)]"
                        style={{
                          left: `${globalStats.total_services > 0 ? (globalStats.total_result_past / globalStats.total_services) * 100 : 0}%`,
                          width: `${globalStats.total_services > 0 ? (100 - (globalStats.total_result_past / globalStats.total_services) * 100) : 0}%`
                        }}
                      />
                    </div>
                  </div>

                  {/* Section 2: Goals & Missing Volume (Center - Expanded to 4 cols) */}
                  <div className="lg:col-span-4 space-y-2 bg-gradient-to-br from-red-50/50 to-orange-50/20 p-3.5 rounded-2xl border border-red-100/50 flex flex-col justify-center shadow-sm">
                    <div className="flex flex-col gap-1.5">
                      {(() => {
                        const displayTarget100 = Math.round(targetData.target);
                        const displayTarget30 = Math.round(targetData.target_30);
                        const missing100 = Math.max(0, displayTarget100 - globalStats.total_services);
                        const missing30 = Math.max(0, displayTarget30 - globalStats.total_services);
                        return (
                          <>
                            {/* Target 100% Row */}
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-1.5">
                                <div className="p-1 rounded bg-red-100 text-red-600">
                                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                                    <circle cx="12" cy="12" r="10" />
                                    <circle cx="12" cy="12" r="6" />
                                    <circle cx="12" cy="12" r="2" />
                                  </svg>
                                </div>
                                <div className="text-[10px] font-black text-red-600 uppercase tracking-[0.15em] leading-none text-left">เป้าหมาย (100%)</div>
                              </div>
                              <div className="flex items-baseline gap-1">
                                <span className="text-xl font-black text-red-700 tracking-tight leading-none">{displayTarget100.toLocaleString()}</span>
                                <span className="text-[9px] font-bold text-red-600/70 uppercase tracking-widest leading-none">ครั้ง</span>
                              </div>
                            </div>

                            {/* Missing 100% Row */}
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-1.5">
                                <div className="p-1 rounded bg-red-100/50 text-[#FF6B6B]">
                                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                                    <path d="M22 12h-4l-3 9L9 3l-3 9H2" />
                                  </svg>
                                </div>
                                <div className="text-[10px] font-black text-[#FF6B6B] uppercase tracking-[0.15em] leading-none text-left">ผลงานขาดอีก (100%)</div>
                              </div>
                              <div className="flex items-baseline gap-1">
                                <span className="text-xl font-black text-[#FF6B6B] tracking-tight leading-none">{missing100.toLocaleString()}</span>
                                <span className="text-[9px] font-bold text-[#FF6B6B]/70 uppercase tracking-widest leading-none">ครั้ง</span>
                              </div>
                            </div>

                            <div className="h-[0.5px] w-full bg-red-200/30 my-0.5" />

                            {/* Target 30% Row */}
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-1.5">
                                <div className="p-1 rounded bg-red-100 text-red-600">
                                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                                    <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                                    <polyline points="22 4 12 14.01 9 11.01" />
                                  </svg>
                                </div>
                                <div className="text-[10px] font-black text-red-600 uppercase tracking-[0.15em] leading-none text-left">เป้าหมาย (30%)</div>
                              </div>
                              <div className="flex items-baseline gap-1">
                                <span className="text-xl font-black text-red-700 tracking-tight leading-none">{displayTarget30.toLocaleString()}</span>
                                <span className="text-[9px] font-bold text-red-600/70 uppercase tracking-widest leading-none">ครั้ง</span>
                              </div>
                            </div>

                            {/* Missing 30% Row */}
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-1.5">
                                <div className="p-1 rounded bg-red-100/50 text-[#FF6B6B]">
                                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                                    <path d="M22 12h-4l-3 9L9 3l-3 9H2" />
                                  </svg>
                                </div>
                                <div className="text-[10px] font-black text-[#FF6B6B] uppercase tracking-[0.15em] leading-none text-left">ผลงานขาดอีก (30%)</div>
                              </div>
                              <div className="flex items-baseline gap-1">
                                <span className="text-xl font-black text-[#FF6B6B] tracking-tight leading-none">{missing30.toLocaleString()}</span>
                                <span className="text-[9px] font-bold text-[#FF6B6B]/70 uppercase tracking-widest leading-none">ครั้ง</span>
                              </div>
                            </div>
                          </>
                        );
                      })()}
                    </div>

                    <div className="h-1.5 w-full bg-red-100/20 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-red-500/60 transition-all duration-1000 ease-out"
                        style={{ width: `${targetData.target > 0 ? Math.min((globalStats.total_services / targetData.target) * 100, 100) : 0}%` }}
                      />
                    </div>
                  </div>

                  {/* Section 3: Achievement KPI (Right - 2 cols) */}
                  <div className="lg:col-span-2 flex flex-col justify-center items-center relative py-2">
                    <div className="absolute inset-0 bg-emerald-50/25 rounded-2xl -z-10 blur-sm border border-emerald-100/30" />

                    <div className="relative group cursor-pointer transition-transform hover:scale-105 duration-500">
                      <LiquidProgress
                        value={targetData.target > 0 ? (globalStats.total_services / targetData.target) * 100 : 0}
                        size={120}
                        color="#059669" // emerald-600
                        bgColor="#E1EFEA"
                      >
                        <div className="flex flex-col items-center">
                          <span className="text-[10px] font-black text-emerald-900/40 uppercase tracking-tighter leading-none mb-1">ผลงาน</span>
                          <div className="flex items-baseline leading-none">
                            <span className="text-3xl font-black text-emerald-900 tracking-tighter">
                              {targetData.target > 0 ? (new Intl.NumberFormat("th-TH", { minimumFractionDigits: 0, maximumFractionDigits: 2 }).format((globalStats.total_services / targetData.target) * 100)) : 0}
                            </span>
                            <span className="text-sm font-black text-emerald-900/60">%</span>
                          </div>
                        </div>
                      </LiquidProgress>

                      {/* Pulse effect if near 100% or just for WOW */}
                      <div className="absolute inset-0 rounded-full border-4 border-emerald-400 opacity-0 group-hover:animate-ping duration-700" />
                    </div>
                  </div>
                </div>
              </div>
            </SoftCard>
          </div>

          {/* Secondary Column: Unified Platform Distribution */}
          <div className="lg:col-span-4 flex flex-col">
            <SoftCard className="p-4 h-full group transition-all duration-300 shadow-xl border-t-4 border-slate-700 bg-white/95 backdrop-blur-xl relative overflow-hidden flex flex-col justify-between min-h-[300px]">
              {/* Decorative Background */}
              <div className="absolute inset-0 opacity-[0.02] pointer-events-none bg-[radial-gradient(#1e293b_1px,transparent_1px)] [background-size:16px_16px]" />

              <div className="relative z-10 w-full mb-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="p-1.5 rounded-lg bg-slate-100 text-slate-800">
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                        <line x1="18" y1="20" x2="18" y2="10" />
                        <line x1="12" y1="20" x2="12" y2="4" />
                        <line x1="6" y1="20" x2="6" y2="14" />
                      </svg>
                    </div>
                    <h3 className="text-[11px] font-black text-slate-800 uppercase tracking-widest leading-none">PLATFORM</h3>
                  </div>
                  <div className="px-2 py-1 bg-slate-50 border border-slate-100 rounded-lg">
                    <span className="text-[10px] font-black text-slate-400">รวม : {globalStats.total_services.toLocaleString()}</span>
                  </div>
                </div>
              </div>

              {/* The Horizontal Stacked Bar */}
              <div className="relative py-2 w-full">
                <div className="h-4 w-full bg-slate-100 rounded-xl overflow-hidden flex shadow-inner border border-slate-200/50">
                  {/* MOPH */}
                  <div
                    className="h-full bg-gradient-to-r from-emerald-700 to-[#006837] transition-all duration-1000 ease-out relative group/bar"
                    style={{ width: `${globalStats.total_services > 0 ? (globalStats.total_moph / globalStats.total_services * 100) : 0}%` }}
                  >
                    <div className="absolute inset-0 bg-white/10 opacity-0 group-hover/bar:opacity-100 transition-opacity" />
                  </div>
                  {/* SORN */}
                  <div
                    className="h-full bg-gradient-to-r from-[#00ADEF] to-sky-600 transition-all duration-1000 ease-out relative group/bar"
                    style={{ width: `${globalStats.total_services > 0 ? (globalStats.total_buddycare / globalStats.total_services * 100) : 0}%` }}
                  >
                    <div className="absolute inset-0 bg-white/10 opacity-0 group-hover/bar:opacity-100 transition-opacity" />
                  </div>
                  {/* HDC */}
                  <div
                    className="h-full bg-gradient-to-r from-purple-500 to-[#7C3AED] transition-all duration-1000 ease-out relative group/bar"
                    style={{ width: `${globalStats.total_services > 0 ? (globalStats.total_hdc / globalStats.total_services * 100) : 0}%` }}
                  >
                    <div className="absolute inset-0 bg-white/10 opacity-0 group-hover/bar:opacity-100 transition-opacity" />
                  </div>
                  {/* Health Connex */}
                  <div
                    className="h-full bg-gradient-to-r from-rose-400 to-[#FF6B6B] transition-all duration-1000 ease-out relative group/bar"
                    style={{ width: `${globalStats.total_services > 0 ? (globalStats.total_healthconnex / globalStats.total_services * 100) : 0}%` }}
                  >
                    <div className="absolute inset-0 bg-white/10 opacity-0 group-hover/bar:opacity-100 transition-opacity" />
                  </div>
                </div>
              </div>

              {/* Grid 2x2 of Platforms */}
              <div className="grid grid-cols-2 gap-3 mt-1">
                {/* 1. MOPH */}
                <div className="p-2.5 bg-slate-50 border border-slate-100/80 rounded-2xl flex flex-col justify-between hover:shadow-md transition-shadow">
                  <div className="flex items-center justify-between mb-1.5">
                    <div className="p-1 bg-emerald-50 rounded-lg text-[#006837] flex-shrink-0">
                      <svg width="20" height="20" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <circle cx="50" cy="22" r="14" fill="#006837" />
                        <path d="M25 40H75V75C75 80 71 84 66 84H34C29 84 25 80 25 75V40Z" stroke="#F6D76E" strokeWidth="10" />
                      </svg>
                    </div>
                    <span className="text-[11px] font-black text-[#006837] tracking-tighter">
                      {globalStats.total_services > 0 ? (new Intl.NumberFormat("th-TH", { minimumFractionDigits: 0, maximumFractionDigits: 1 }).format((globalStats.total_moph / globalStats.total_services) * 100)) : 0}%
                    </span>
                  </div>
                  <div>
                    <p className="text-[8px] font-black text-slate-400 uppercase tracking-tighter leading-none mb-1 truncate">หมอพร้อม STATION</p>
                    <div className="flex items-baseline justify-between gap-1 flex-wrap">
                      <p className="text-sm font-black text-slate-800 leading-none">{(globalStats.total_moph).toLocaleString()} <span className="text-[8px] font-bold text-slate-400">ครั้ง</span></p>
                      {(globalStats.total_moph - (globalStats.total_moph_past || 0)) !== 0 && (
                        <span className={`text-[10px] font-black px-1.5 py-0.5 rounded-md flex items-center leading-none ${
                          (globalStats.total_moph - (globalStats.total_moph_past || 0)) > 0
                            ? 'bg-emerald-50 text-emerald-600 border border-emerald-200/60'
                            : 'bg-rose-50 text-rose-600 border border-rose-200/60'
                        }`} title={`ครั้งก่อน: ${(globalStats.total_moph_past || 0).toLocaleString()}`}>
                          {(globalStats.total_moph - (globalStats.total_moph_past || 0)) > 0 ? '+' : ''}
                          {(globalStats.total_moph - (globalStats.total_moph_past || 0)).toLocaleString()}
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* 2. SORN */}
                <div className="p-2.5 bg-slate-50 border border-slate-100/80 rounded-2xl flex flex-col justify-between hover:shadow-md transition-shadow">
                  <div className="flex items-center justify-between mb-1.5">
                    <div className="p-1 bg-sky-50 rounded-lg text-[#00ADEF] flex-shrink-0">
                      <svg width="20" height="20" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M10 45L50 15L90 45" stroke="#00ADEF" strokeWidth="12" strokeLinecap="round" />
                        <circle cx="75" cy="62" r="8" fill="#0060A9" />
                      </svg>
                    </div>
                    <span className="text-[11px] font-black text-[#00ADEF] tracking-tighter">
                      {globalStats.total_services > 0 ? (new Intl.NumberFormat("th-TH", { minimumFractionDigits: 0, maximumFractionDigits: 1 }).format((globalStats.total_buddycare / globalStats.total_services) * 100)) : 0}%
                    </span>
                  </div>
                  <div>
                    <p className="text-[8px] font-black text-slate-400 uppercase tracking-tighter leading-none mb-1 truncate">สอน.บัดดี้</p>
                    <div className="flex items-baseline justify-between gap-1 flex-wrap">
                      <p className="text-sm font-black text-slate-800 leading-none">{(globalStats.total_buddycare).toLocaleString()} <span className="text-[8px] font-bold text-slate-400">ครั้ง</span></p>
                      {(globalStats.total_buddycare - (globalStats.total_buddycare_past || 0)) !== 0 && (
                        <span className={`text-[10px] font-black px-1.5 py-0.5 rounded-md flex items-center leading-none ${
                          (globalStats.total_buddycare - (globalStats.total_buddycare_past || 0)) > 0
                            ? 'bg-emerald-50 text-emerald-600 border border-emerald-200/60'
                            : 'bg-rose-50 text-rose-600 border border-rose-200/60'
                        }`} title={`ครั้งก่อน: ${(globalStats.total_buddycare_past || 0).toLocaleString()}`}>
                          {(globalStats.total_buddycare - (globalStats.total_buddycare_past || 0)) > 0 ? '+' : ''}
                          {(globalStats.total_buddycare - (globalStats.total_buddycare_past || 0)).toLocaleString()}
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* 3. HDC */}
                <div className="p-2.5 bg-slate-50 border border-slate-100/80 rounded-2xl flex flex-col justify-between hover:shadow-md transition-shadow">
                  <div className="flex items-center justify-between mb-1.5">
                    <div className="p-1 bg-purple-50 rounded-lg text-[#7C3AED] flex-shrink-0">
                      <svg width="20" height="20" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <text x="50" y="55" dominantBaseline="middle" textAnchor="middle" fill="#7C3AED" fontWeight="900" fontSize="42" fontFamily="Inter, sans-serif">H</text>
                        <path d="M20 75H80" stroke="#F6D76E" strokeWidth="12" strokeLinecap="round" />
                      </svg>
                    </div>
                    <span className="text-[11px] font-black text-[#7C3AED] tracking-tighter">
                      {globalStats.total_services > 0 ? (new Intl.NumberFormat("th-TH", { minimumFractionDigits: 0, maximumFractionDigits: 1 }).format((globalStats.total_hdc / globalStats.total_services) * 100)) : 0}%
                    </span>
                  </div>
                  <div>
                    <p className="text-[8px] font-black text-slate-400 uppercase tracking-tighter leading-none mb-1 truncate">HDC</p>
                    <div className="flex items-baseline justify-between gap-1 flex-wrap">
                      <p className="text-sm font-black text-slate-800 leading-none">{(globalStats.total_hdc).toLocaleString()} <span className="text-[8px] font-bold text-slate-400">ครั้ง</span></p>
                      {(globalStats.total_hdc - (globalStats.total_hdc_past || 0)) !== 0 && (
                        <span className={`text-[10px] font-black px-1.5 py-0.5 rounded-md flex items-center leading-none ${
                          (globalStats.total_hdc - (globalStats.total_hdc_past || 0)) > 0
                            ? 'bg-emerald-50 text-emerald-600 border border-emerald-200/60'
                            : 'bg-rose-50 text-rose-600 border border-rose-200/60'
                        }`} title={`ครั้งก่อน: ${(globalStats.total_hdc_past || 0).toLocaleString()}`}>
                          {(globalStats.total_hdc - (globalStats.total_hdc_past || 0)) > 0 ? '+' : ''}
                          {(globalStats.total_hdc - (globalStats.total_hdc_past || 0)).toLocaleString()}
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* 4. Health Connex */}
                <div className="p-2.5 bg-slate-50 border border-slate-100/80 rounded-2xl flex flex-col justify-between hover:shadow-md transition-shadow">
                  <div className="flex items-center justify-between mb-1.5">
                    <div className="p-1 bg-rose-50 rounded-lg text-[#FF6B6B] flex-shrink-0">
                      <svg width="20" height="20" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <text x="50" y="55" dominantBaseline="middle" textAnchor="middle" fill="#FF6B6B" fontWeight="900" fontSize="42" fontFamily="Inter, sans-serif">H</text>
                        <path d="M15 50H85M50 15V85" stroke="#F6D76E" strokeWidth="12" strokeLinecap="round" />
                      </svg>
                    </div>
                    <span className="text-[11px] font-black text-[#FF6B6B] tracking-tighter">
                      {globalStats.total_services > 0 ? (new Intl.NumberFormat("th-TH", { minimumFractionDigits: 0, maximumFractionDigits: 1 }).format((globalStats.total_healthconnex / globalStats.total_services) * 100)) : 0}%
                    </span>
                  </div>
                  <div>
                    <p className="text-[8px] font-black text-slate-400 uppercase tracking-tighter leading-none mb-1 truncate">Health Connex</p>
                    <div className="flex items-baseline justify-between gap-1 flex-wrap">
                      <p className="text-sm font-black text-slate-800 leading-none">{(globalStats.total_healthconnex).toLocaleString()} <span className="text-[8px] font-bold text-slate-400">ครั้ง</span></p>
                      {(globalStats.total_healthconnex - (globalStats.total_healthconnex_past || 0)) !== 0 && (
                        <span className={`text-[10px] font-black px-1.5 py-0.5 rounded-md flex items-center leading-none ${
                          (globalStats.total_healthconnex - (globalStats.total_healthconnex_past || 0)) > 0
                            ? 'bg-emerald-50 text-emerald-600 border border-emerald-200/60'
                            : 'bg-rose-50 text-rose-600 border border-rose-200/60'
                        }`} title={`ครั้งก่อน: ${(globalStats.total_healthconnex_past || 0).toLocaleString()}`}>
                          {(globalStats.total_healthconnex - (globalStats.total_healthconnex_past || 0)) > 0 ? '+' : ''}
                          {(globalStats.total_healthconnex - (globalStats.total_healthconnex_past || 0)).toLocaleString()}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </SoftCard>
          </div>
        </div>

        {/* District Stats Section */}
        <div className="lg:col-span-12">
          <DistrictTable />
        </div>

        {/* Top Improvers Section (Added) */}
        <div className="lg:col-span-12 mt-8">
          <TopImprovers />
        </div>
      </div>
      <Footer />
    </main>
  );
}
