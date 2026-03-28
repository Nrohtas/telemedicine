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
    total_hospitals: 0,
    total_moph: 0,
    total_buddycare: 0
  });
  const [targetData, setTargetData] = useState({
    total_result: 0,
    target: 0,
    target_2: 0,
    target_4: 0,
    target_8: 0,
    target_10: 0
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
        const response = await fetch('/telemedicine/api/target', { cache: 'no-store' });
        const data = await response.json();
        if (!data.error) {
          setTargetData(data);
        }
      } catch (err) {
        console.error('Error fetching target data:', err);
      }
    };

    fetchGlobalStats();
    fetchTargetData();
  }, []);


  const stats = [
    {
      label: "การรับบริการ",
      value: globalStats.total_services.toLocaleString(),
      unit: "ครั้ง",
      trend: "+12%",
      color: "text-red-500",
      icon: (
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <path d="M11 2a2 2 0 0 0-2 2v5H4a2 2 0 0 0-2 2v2a2 2 0 0 0 2 2h5v5a2 2 0 0 0 2 2h2a2 2 0 0 0 2-2v-5h5a2 2 0 0 0 2-2v-2a2 2 0 0 0-2-2h-5V4a2 2 0 0 0-2-2h-2z" />
        </svg>
      )
    },
    {
      label: "หน่วยบริการ",
      value: globalStats.total_hospitals.toLocaleString(),
      unit: "แห่ง",
      trend: "+5%",
      color: "text-pink-500",
      href: "/hospital",
      icon: (
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <path d="M19 21V5a2 2 0 0 0-2-2H7a2 2 0 0 0-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
        </svg>
      )
    },
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

        {/* Stats Section Cards */}
        <div className="lg:col-span-12 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {stats.map((stat, idx) => {
            const cardContent = (
              <SoftCard className={`p-6 group transition-all duration-300 ${stat.href ? 'hover:translate-y-[-4px] cursor-pointer' : 'cursor-default'}`}>
                <div className="flex justify-between items-start mb-4">
                  <div className="flex items-center gap-3">
                    <div className={`p-2 rounded-xl nm-inset shadow-inner opacity-90 ${stat.color} bg-white/50`}>
                      {stat.icon}
                    </div>
                    <span className={`text-xs font-black uppercase tracking-[0.2em] leading-tight ${stat.color}`}>{stat.label}</span>
                  </div>
                </div>
                <div className="flex flex-col relative">
                  <div className="flex items-center gap-4">
                    {/* Primary Metric: Count */}
                    <div className="flex items-baseline gap-2">
                      <span className={`text-4xl font-black tracking-tighter ${stat.color}`}>{stat.value}</span>
                      <span className={`text-sm font-bold uppercase tracking-widest ${stat.color}`}>{stat.unit}</span>
                    </div>

                    {/* Secondary Full-Size Metric: Percentage (For Card 1 Only) */}
                    {idx === 0 && (
                      <>
                        <div className="h-8 w-px bg-gray-200 mx-1" />
                        <div className="flex items-baseline gap-1">
                          <span className="text-4xl font-black tracking-tighter text-violet-600">
                            {targetData.target > 0 ? ((globalStats.total_services / targetData.target) * 100).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : 0}
                          </span>
                          <span className="text-sm font-bold uppercase tracking-widest text-violet-600">%</span>
                        </div>
                      </>
                    )}
                  </div>
                </div>
              </SoftCard>
            );

            return stat.href ? (
              <Link key={idx} href={stat.href} className="block">
                {cardContent}
              </Link>
            ) : (
              <div key={idx} className="block">
                {cardContent}
              </div>
            );
          })}
        </div>

        {/* Unified Target Milestone Card with Connector */}
        <div className="lg:col-span-12 relative">
          {/* Visual Connector: Vertical Dashed Line from Service Card (idx 0) */}
          <div className="absolute -top-10 left-[12.5%] w-px h-10 border-l-2 border-dashed border-red-400/30 hidden lg:block" />
          
          <SoftCard className="p-6 bg-white/70 border-t-4 border-red-500 shadow-xl backdrop-blur-md overflow-hidden transition-all duration-500 hover:shadow-2xl">
            {/* Context Header */}
            <div className="flex items-center gap-3 mb-8 px-4 py-2 bg-red-50/30 rounded-2xl border border-red-100/50 w-fit">
              <div className="p-1.5 rounded-lg bg-red-500 text-white shadow-sm">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M11 2a2 2 0 0 0-2 2v5H4a2 2 0 0 0-2 2v2a2 2 0 0 0 2 2h5v5a2 2 0 0 0 2 2h2a2 2 0 0 0 2-2v-5h5a2 2 0 0 0 2-2v-2a2 2 0 0 0-2-2h-5V4a2 2 0 0 0-2-2h-2z" />
                </svg>
              </div>
              <h4 className="text-sm font-black text-red-600 uppercase tracking-widest">โครงการติดตามสถิติจากจังหวัด</h4>
            </div>

            {/* Visual Multi-Milestone Progress Bar (Aligned to Column Centers) */}
            <div className="mt-12 mb-10 px-6 sm:px-10">
              <div className="relative h-4 bg-gray-100/50 rounded-full shadow-inner overflow-visible">
                {/* Main Progress Bar (Milestone-Step Logic) */}
                {(() => {
                  const services = globalStats.total_services;
                  const milestones = [
                    { t: targetData.target_2, w: 10 },
                    { t: targetData.target_4, w: 30 },
                    { t: targetData.target_8, w: 50 },
                    { t: targetData.target_10, w: 70 },
                    { t: targetData.target, w: 90 }
                  ];

                  let visualWidth = 0;
                  if (services <= milestones[0].t && milestones[0].t > 0) {
                    visualWidth = (services / milestones[0].t) * 10;
                  } else {
                    for (let i = 0; i < milestones.length - 1; i++) {
                      if (services > milestones[i].t && services <= milestones[i + 1].t) {
                        const segmentRange = milestones[i + 1].t - milestones[i].t;
                        const segmentProgress = (services - milestones[i].t) / segmentRange;
                        visualWidth = milestones[i].w + (segmentProgress * 20); // Each step is 20%
                        break;
                      }
                    }
                    if (services > milestones[4].t) visualWidth = 100;
                  }

                  return (
                    <div
                      className="absolute top-0 left-0 h-full rounded-full bg-gradient-to-r from-red-300 via-pink-400 to-red-500 shadow-[0_0_15px_rgba(239,68,68,0.3)] transition-all duration-1000 ease-out z-10"
                      style={{ width: `${visualWidth}%` }}
                    />
                  );
                })()}

                {/* Milestone Markers (Centered over Grid Columns) */}
                {[
                  { label: "2%", val: 10, target: targetData.target_2, color: "bg-pink-400" },
                  { label: "4%", val: 30, target: targetData.target_4, color: "bg-orange-400" },
                  { label: "8%", val: 50, target: targetData.target_8, color: "bg-yellow-400" },
                  { label: "10%", val: 70, target: targetData.target_10, color: "bg-green-400" },
                  { label: "100%", val: 90, target: targetData.target, color: "bg-blue-400" }
                ].map((m, i) => {
                  const isReached = globalStats.total_services >= m.target && m.target > 0;
                  return (
                    <div key={i} className="absolute h-10 w-px bg-red-500/10 top-1/2 -translate-y-1/2 z-20" style={{ left: `${m.val}%` }}>
                      <div className={`absolute -top-7 left-1/2 -translate-x-1/2 text-[10px] font-black ${isReached ? "text-red-500" : "text-gray-400"} whitespace-nowrap`}>
                        {m.label}
                      </div>
                      <div className={`absolute -bottom-1.5 left-1/2 -translate-x-1/2 w-3.5 h-3.5 rounded-full border-2 border-white shadow-sm ${isReached ? "bg-red-500 scale-110 shadow-red-200" : "bg-gray-200 scale-100"} transition-all duration-500`} />
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Detailed Breakdown Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
              {[
                { label: "เป้าหมาย 2%", target: targetData.target_2, color: "pink", icon: "🚀" },
                { label: "เป้าหมาย 4%", target: targetData.target_4, color: "orange", icon: "⭐" },
                { label: "เป้าหมาย 8%", target: targetData.target_8, color: "yellow", icon: "🔥" },
                { label: "เป้าหมาย 10%", target: targetData.target_10, color: "green", icon: "💎" },
                { label: "เป้าหมาย 100%", target: targetData.target, color: "blue", icon: "🏆" },
              ].map((item, idx) => {
                const services = globalStats.total_services;
                const isAchieved = services >= item.target && item.target > 0;
                const remaining = isAchieved ? 0 : item.target - services;

                return (
                  <div key={idx} className={`p-4 rounded-2xl border transition-all duration-300 flex flex-col items-center text-center ${isAchieved ? "bg-red-50/30 border-red-100" : "bg-gray-50/30 border-gray-100 hover:bg-gray-50"}`}>
                    <div className="flex items-center gap-1 mb-3">
                      <span className="text-base">{item.icon}</span>
                      <span className={`text-[11px] font-black uppercase tracking-wider ${isAchieved ? "text-red-600" : "text-red-400"}`}>{item.label}</span>
                    </div>

                    <div className="mb-3">
                      <div className="text-[10px] font-bold text-gray-400 mb-0.5 uppercase tracking-[0.1em]">เป้าหมาย</div>
                      <div className="text-xl font-black text-red-600 tracking-tighter">{item.target.toLocaleString()} <span className="text-[10px] font-bold">ครั้ง</span></div>
                    </div>

                    <div className="w-full h-px bg-red-100/50 mb-3" />

                    <div className="w-full">
                      {isAchieved ? (
                        <div className="text-green-600 text-[10px] font-black flex flex-col items-center gap-1">
                          <span className="bg-green-100 px-3 py-1 rounded-full border border-green-200 shadow-sm">✓ บรรลุเป้าหมายแล้ว</span>
                        </div>
                      ) : (
                        <div className="flex flex-col items-center">
                          <span className="text-[10px] font-black text-rose-500 uppercase tracking-widest leading-none">ขาดอีก {remaining.toLocaleString()} ครั้ง</span>
                          <div className="w-full bg-red-50/50 rounded-full h-1.5 mt-2.5 overflow-hidden border border-red-50/30 ring-1 ring-red-100/20">
                            <div
                              className="bg-gradient-to-r from-red-400 to-pink-500 h-full transition-all duration-1000"
                              style={{ width: `${Math.min((services / item.target) * 100, 100)}%` }}
                            />
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </SoftCard>
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
