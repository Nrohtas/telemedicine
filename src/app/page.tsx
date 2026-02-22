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

  React.useEffect(() => {
    // Fetch global stats
    fetch('/api/global-stats')
      .then(res => res.json())
      .then(data => {
        if (!data.error) {
          setGlobalStats(data);
        }
      })
      .catch(err => console.error('Error fetching global stats:', err));
  }, []);


  const stats = [
    {
      label: "จำนวนการรับบริการ",
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
      label: "จำนวนหน่วยบริการ",
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
                    <span className="text-xs font-black text-slate-400 uppercase tracking-[0.2em] leading-tight">{stat.label}</span>
                  </div>
                </div>
                <div className="flex items-baseline gap-2">
                  <span className={`text-5xl font-black tracking-tighter ${stat.color}`}>{stat.value}</span>
                  <span className="text-sm font-bold text-slate-400 uppercase tracking-widest">{stat.unit}</span>
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

        {/* District Stats Section */}
        <div className="lg:col-span-12">
          <DistrictTable />
        </div>
      </div>
      <Footer />
    </main>
  );
}
