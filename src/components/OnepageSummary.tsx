"use client";

import React, { useRef, useCallback } from 'react';
import { domToJpeg } from 'modern-screenshot';
import {
  PieChart, Pie, Cell, Tooltip,
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Legend, ResponsiveContainer, LabelList
} from 'recharts';
import { motion, Variants } from 'framer-motion';
import SoftCard from './ui/SoftCard';

export default function OnepageSummary({ data }: { data: any }) {
  const { pie, totals, hTotals, subhTotals, formattedDate, districtData, hospitalData, top10Data } = data;
  const dashboardRef = useRef<HTMLDivElement>(null);

  const handleExport = useCallback(() => {
    if (dashboardRef.current === null) return;

    const exportBtn = document.getElementById('export-button');
    if (exportBtn) exportBtn.style.opacity = '0';

    domToJpeg(dashboardRef.current, {
      backgroundColor: '#f8fafc',
      scale: 2,
    })
      .then((dataUrl) => {
        const now = new Date();
        const yyyymmdd = now.getFullYear() + String(now.getMonth() + 1).padStart(2, '0') + String(now.getDate()).padStart(2, '0');
        const hhmm = String(now.getHours()).padStart(2, '0') + String(now.getMinutes()).padStart(2, '0');
        const link = document.createElement('a');
        link.download = `Telemed-PLK-Onepage-${yyyymmdd}-${hhmm}.jpg`;
        link.href = dataUrl;
        link.click();
        if (exportBtn) exportBtn.style.opacity = '1';
      })
      .catch((err) => {
        console.error('Export failed:', err);
        if (exportBtn) exportBtn.style.opacity = '1';
      });
  }, [formattedDate]);

  const COLORS = {
    dashboard: '#7C3AED', // Vivid Violet
    hdc: '#059669',      // Emerald Green
    type2: '#A78BFA',    // Light Purple
    type3: '#F87171',    // Red
    type5: '#3B82F6',    // Blue
  };

  const containerVariants: Variants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  };

  const itemVariants: Variants = {
    hidden: { y: 20, opacity: 0 },
    visible: {
      y: 0,
      opacity: 1,
      transition: { type: 'spring', stiffness: 100 }
    }
  };

  const renderCustomizedLabel = (props: any) => {
    const { x, y, width, value } = props;
    if (value === undefined || value === null || value === 0) return null;
    return (
      <text x={x + width + 5} y={y + 12} fill="#4B5563" fontSize={18} fontWeight="bold" textAnchor="start">
        {Number(value).toLocaleString()}
      </text>
    );
  };

  const renderVerticalLabel = (props: any) => {
    const { x, y, width, value } = props;
    if (value === undefined || value === null || value === 0) return null;
    return (
      <text x={x + width / 2} y={y - 8} fill="#4B5563" fontSize={10} fontWeight="bold" textAnchor="middle">
        {Number(value).toLocaleString()}
      </text>
    );
  };

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white/90 backdrop-blur-md p-3 border border-indigo-100 rounded-2xl shadow-xl">
          <p className="text-xs font-black text-indigo-900 mb-1">{label}</p>
          {payload.map((entry: any, index: number) => (
            <div key={index} className="flex items-center gap-2 text-[11px] font-bold">
              <div className="w-2 h-2 rounded-full" style={{ backgroundColor: entry.color }}></div>
              <span className="text-slate-500">{entry.name}:</span>
              <span className="text-slate-900">{entry.value.toLocaleString()}</span>
            </div>
          ))}
        </div>
      );
    }
    return null;
  };

  return (
    <motion.div
      ref={dashboardRef}
      initial="hidden"
      animate="visible"
      variants={containerVariants}
      className="w-full max-w-[1400px] mx-auto p-4 md:p-10 space-y-8 bg-slate-50"
    >

      {/* Header Section */}
      <motion.div variants={itemVariants} className="flex flex-col md:flex-row justify-between items-center gap-6 mb-4">
        <div className="flex items-center gap-6">
          <div className="w-16 h-16 flex items-center justify-center">
            <img src="/telemedicine/logo-moph.png" alt="MOPH" className="w-full h-full object-contain drop-shadow-sm" />
          </div>
          <div>
            <h1 className="text-2xl md:text-3xl font-black text-indigo-950 tracking-tighter leading-none">
              ผลงาน Telemedicine <span className="text-emerald-600">จังหวัดพิษณุโลก</span>
            </h1>
            <div className="flex items-center gap-2 mt-2">
              <p className="text-[13px] font-black text-purple-900 uppercase tracking-tight">
                สำนักงานสาธารณสุขจังหวัดพิษณุโลก
              </p>
              <div className="w-[1px] h-3 bg-slate-300 mx-1" />
              <p className="text-[13px] font-black text-indigo-600 uppercase tracking-tight">
                กลุ่มงานสุขภาพดิจิทัล
              </p>
            </div>
          </div>
        </div>
        <div className="flex flex-col md:flex-row items-center gap-4">
          <button
            id="export-button"
            onClick={handleExport}
            className="flex items-center gap-2 px-4 py-2.5 bg-white/80 hover:bg-white text-slate-500 border border-slate-200 rounded-2xl shadow-sm transition-all active:scale-95 group"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" /><circle cx="12" cy="13" r="4" />
            </svg>
            <span className="text-xs font-black uppercase tracking-wider">Export JPG</span>
          </button>

          <div className="flex flex-col items-end">
            <div className="bg-white/80 backdrop-blur-md px-6 py-3 rounded-2xl shadow-sm border border-indigo-50 flex items-center gap-5">
              <div className="flex items-center gap-2.5 pr-5 border-r border-indigo-100">
                <span className="text-[10px] font-black text-emerald-500 uppercase tracking-widest leading-none">ที่มา</span>
                <span className="text-xs font-black text-slate-600 leading-none">
                  ระบบ HIS / HDC
                </span>
              </div>
              <div className="flex items-center gap-2.5">
                <span className="text-[10px] font-black text-indigo-400 uppercase tracking-widest leading-none">Update</span>
                <span className="text-sm font-black text-indigo-900 tabular-nums leading-none">
                  {formattedDate}
                </span>
              </div>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Hero Stats Row */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-8">

        {/* Pie Chart Card */}
        <motion.div variants={itemVariants} className="xl:col-span-6 h-full">
          <SoftCard className="p-6 h-full flex flex-col items-center justify-center relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-50 rounded-full -mr-16 -mt-16 blur-2xl opacity-50 group-hover:opacity-100 transition-opacity" />

            <h3 className="text-lg font-black text-indigo-950 mb-4 self-start flex items-center gap-2">
              <div className="w-1.5 h-6 bg-indigo-600 rounded-full" />
              สัดส่วนประเภทการมารับบริการทั้งจังหวัด
            </h3>

            <ResponsiveContainer width="100%" height={240}>
              <PieChart>
                <Pie
                  data={pie}
                  cx="50%"
                  cy="50%"
                  innerRadius={70}
                  outerRadius={100}
                  paddingAngle={8}
                  dataKey="value"
                  animationBegin={0}
                  animationDuration={1500}
                >
                  {pie.map((entry: any, index: number) => (
                    <Cell key={`cell-${index}`} fill={entry.fill} stroke="white" strokeWidth={4} />
                  ))}
                </Pie>
                <Tooltip content={<CustomTooltip />} />
              </PieChart>
            </ResponsiveContainer>

            <div className="grid grid-cols-3 gap-4 w-full mt-4">
              {pie.map((item: any, idx: number) => (
                <div
                  key={idx}
                  className="flex flex-col items-center p-4 rounded-2xl border transition-all duration-300 shadow-sm hover:shadow-md hover:scale-[1.02]"
                  style={{
                    backgroundColor: item.fill + '15', // ~8% opacity
                    borderColor: item.fill + '50',      // ~31% opacity
                  }}
                >
                  <span className="text-xs font-black uppercase tracking-wider mb-1.5 text-slate-700">
                    {item.name.split('(')[0]}
                  </span>
                  <span className="text-3xl font-black text-slate-900 leading-none">
                    {((item.value / totals.total235) * 100).toFixed(1)}%
                  </span>
                  <span className="text-xs font-bold text-slate-500 mt-1.5 tabular-nums">
                    {item.value.toLocaleString()} ราย
                  </span>
                </div>
              ))}
            </div>
          </SoftCard>
        </motion.div>

        {/* Liquid Progress Card */}
        <motion.div variants={itemVariants} className="xl:col-span-6">
          <SoftCard className="p-6 h-full flex flex-col justify-between relative overflow-hidden group">
            <div className="absolute bottom-0 left-0 w-48 h-48 bg-emerald-50 rounded-full -ml-24 -mb-24 blur-2xl opacity-50" />

            <div className="flex justify-between items-start mb-6">
              <div>
                <h3 className="text-lg font-black text-indigo-950 flex items-center gap-2">
                  <div className="w-1.5 h-6 bg-emerald-600 rounded-full" />
                  สัดส่วนการใช้ Telemedicine ทั้งจังหวัด
                </h3>
              </div>
            </div>

            <div className="flex-1 flex items-center justify-center gap-2 md:gap-8">
              {/* The Formula Section */}
              <div className="flex items-center gap-6">
                {/* Fraction (Left) */}
                <div className="flex flex-col items-center w-48 shrink-0">
                  {/* Top: TYPE 5 */}
                  <div className="w-full py-3 px-4 rounded-xl bg-indigo-50/50 border border-indigo-100 text-center shadow-sm">
                    <span className="text-xs font-black text-indigo-500 uppercase tracking-tighter block mb-1">Telemedicine (TYPEIN 5)</span>
                    <div className="flex items-baseline justify-center gap-1">
                      <span className="text-4xl font-black text-indigo-900 tabular-nums leading-none">{totals.type5.toLocaleString()}</span>
                    </div>
                  </div>

                  {/* Fraction Line */}
                  <div className="w-full h-1 bg-indigo-500 rounded-full my-3 opacity-50 shadow-sm" />

                  {/* Bottom: HIS Total */}
                  <div className="w-full py-3 px-4 rounded-xl bg-emerald-50/50 border border-emerald-100 text-center shadow-sm">
                    <span className="text-xs font-black text-emerald-600 uppercase tracking-tighter block mb-1">Visit (TYPE2+3+5)</span>
                    <div className="flex items-baseline justify-center gap-1">
                      <span className="text-4xl font-black text-emerald-900 tabular-nums leading-none">{totals.total235.toLocaleString()}</span>
                    </div>
                  </div>
                </div>

                {/* Multiplier */}
                <span className="text-xl font-black text-slate-900">X 100</span>

                <span className="text-xl font-black text-slate-400">=</span>

                {/* Semi-Circle Gauge (Right Side - Final Result) */}
                <div className="relative w-48 h-32 flex flex-col items-center justify-center shrink-0">
                  <svg viewBox="0 0 100 60" className="w-full">
                    <defs>
                      <linearGradient id="gaugeGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                        <stop offset="0%" stopColor="#6366f1" />
                        <stop offset="100%" stopColor="#4338ca" />
                      </linearGradient>
                    </defs>
                    <path
                      d="M 10 50 A 40 40 0 0 1 90 50"
                      fill="none"
                      stroke="#ecfdf5"
                      strokeWidth="10"
                      strokeLinecap="round"
                    />
                    <path
                      d="M 10 50 A 40 40 0 0 1 90 50"
                      fill="none"
                      stroke="#10b981"
                      strokeWidth="10"
                      strokeLinecap="round"
                      opacity="0.3"
                    />
                    <motion.path
                      initial={{ pathLength: 0 }}
                      animate={{ pathLength: totals.percentType5 / 100 }}
                      transition={{ duration: 2, ease: "circOut" }}
                      d="M 10 50 A 40 40 0 0 1 90 50"
                      fill="none"
                      stroke="url(#gaugeGradient)"
                      strokeWidth="10"
                      strokeLinecap="round"
                      style={{ filter: 'drop-shadow(0px 4px 6px rgba(79, 70, 229, 0.2))' }}
                    />
                  </svg>
                  {/* Percentage Inside Gauge */}
                  <div className="absolute inset-0 flex items-center justify-center pt-8">
                    <span className="text-4xl font-black text-indigo-600 leading-none">
                      {totals.percentType5.toFixed(2)}%
                    </span>
                  </div>


                </div>
              </div>
            </div>
          </SoftCard>
        </motion.div>
      </div>

      {/* Main Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">

        {/* District Chart */}
        <motion.div variants={itemVariants}>
          <SoftCard className="p-6 h-full">
            <div className="flex items-start justify-between mb-8 px-2">
              <div className="flex items-center gap-6">
                <h3 className="text-lg font-black text-indigo-950 flex items-center gap-2">
                  <div className="w-1.5 h-6 bg-purple-600 rounded-full" />
                  ผลงานรายอำเภอ
                </h3>
                {/* Spacer to match Hospital header height/gauge */}
                <div className="w-36 h-20 hidden md:block" />
              </div>
                <div className="flex gap-4 pt-2">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-violet-600" />
                    <span className="text-[10px] font-bold text-slate-500 uppercase">Dashboard</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-emerald-500" />
                    <span className="text-[10px] font-bold text-slate-500 uppercase">HDC</span>
                  </div>
                </div>
              </div>

            <ResponsiveContainer width="100%" height={500}>
              <BarChart
                data={districtData}
                layout="vertical"
                margin={{ top: 5, right: 60, left: 20, bottom: 5 }}
                barGap={2}
              >
                <XAxis type="number" hide />
                <YAxis
                  dataKey="name"
                  type="category"
                  width={130}
                  tick={{ fontSize: 16, fill: '#64748b', fontWeight: 800 }}
                  axisLine={false}
                  tickLine={false}
                />
                <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(0,0,0,0.02)' }} />
                <Bar dataKey="dashboard" name="Dashboard" fill={COLORS.dashboard} barSize={14} radius={[0, 10, 10, 0]}>
                  <LabelList dataKey="dashboard" content={renderCustomizedLabel} />
                </Bar>
                <Bar dataKey="hdc" name="HDC" fill={COLORS.hdc} barSize={14} radius={[0, 10, 10, 0]}>
                  <LabelList dataKey="hdc" content={renderCustomizedLabel} />
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </SoftCard>
        </motion.div>

        {/* Hospital Chart */}
        <motion.div variants={itemVariants}>
          <SoftCard className="p-6 h-full">
            <div className="flex items-start justify-between mb-8 px-2">
              <div className="flex items-center gap-6">
                <h3 className="text-lg font-black text-indigo-950 flex items-center gap-2">
                  <div className="w-1.5 h-6 bg-blue-600 rounded-full" />
                  ผลงานรายโรงพยาบาล
                </h3>
              </div>

              <div className="flex items-center gap-8 pt-0">
                {/* Summary Gauge moved beside legend */}
                <div className="w-36 h-20 flex flex-col items-center justify-center -mt-4">
                  <span className="text-[10px] font-black text-blue-400 uppercase tracking-tighter mb-0 leading-none">สัดส่วน Telemedicine</span>
                  <div className="relative w-full h-full flex items-center justify-center">
                    <svg viewBox="0 0 100 60" className="w-full">
                      <path d="M 10 50 A 40 40 0 0 1 90 50" fill="none" stroke="#f1f5f9" strokeWidth="12" strokeLinecap="round" />
                      <motion.path
                        initial={{ pathLength: 0 }}
                        animate={{ pathLength: (hTotals?.percentType5 || 0) / 100 }}
                        transition={{ duration: 2, ease: "circOut" }}
                        d="M 10 50 A 40 40 0 0 1 90 50"
                        fill="none"
                        stroke="url(#hospitalCornerGradient)"
                        strokeWidth="12"
                        strokeLinecap="round"
                      />
                      <defs>
                        <linearGradient id="hospitalCornerGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                          <stop offset="0%" stopColor="#3b82f6" />
                          <stop offset="100%" stopColor="#2563eb" />
                        </linearGradient>
                      </defs>
                    </svg>
                    <div className="absolute inset-0 flex items-center justify-center pt-5">
                      <span className="text-lg font-black text-blue-600 tabular-nums">
                        {hTotals?.percentType5.toFixed(2)}%
                      </span>
                    </div>
                  </div>
                </div>

                <div className="flex gap-4">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-violet-600" />
                    <span className="text-[10px] font-bold text-slate-500 uppercase">Dashboard</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-emerald-500" />
                    <span className="text-[10px] font-bold text-slate-500 uppercase">HDC</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="relative">
              <ResponsiveContainer width="100%" height={500}>
                <BarChart
                  data={hospitalData}
                  layout="vertical"
                  margin={{ top: 5, right: 60, left: 40, bottom: 5 }}
                  barGap={2}
                >
                  <XAxis type="number" hide />
                  <YAxis
                    dataKey="name"
                    type="category"
                    width={150}
                    tick={{ fontSize: 16, fill: '#64748b', fontWeight: 800 }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(0,0,0,0.02)' }} />
                  <Bar dataKey="dashboard" name="Dashboard" fill={COLORS.dashboard} barSize={12} radius={[0, 10, 10, 0]}>
                    <LabelList dataKey="dashboard" content={renderCustomizedLabel} />
                  </Bar>
                  <Bar dataKey="hdc" name="HDC" fill={COLORS.hdc} barSize={12} radius={[0, 10, 10, 0]}>
                    <LabelList dataKey="hdc" content={renderCustomizedLabel} />
                  </Bar>
                </BarChart>
              </ResponsiveContainer>

            </div>
          </SoftCard>
        </motion.div>
      </div>


      {/* Bottom Rankings Section */}
      <motion.div variants={itemVariants}>
        <SoftCard className="p-8">
          <div className="flex flex-col md:flex-row justify-between items-end mb-10 px-2 gap-4">
            <div>
              <h3 className="text-xl font-black text-indigo-950 flex items-center gap-3">
                <div className="p-2 bg-indigo-50 rounded-xl">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#6366F1" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="23 6 13.5 15.5 8.5 10.5 1 18" />
                    <polyline points="17 6 23 6 23 12" />
                  </svg>
                </div>
                10 อันดับหน่วยบริการ
              </h3>
              <p className="text-[11px] font-black text-slate-400 uppercase tracking-widest mt-1 ml-11">ความก้าวหน้าผลงานสูงสุด</p>
            </div>
            <div className="flex items-end gap-6">
              {/* Corner Summary Gauge (No Frame) */}
              <div className="w-36 h-24 flex flex-col items-center justify-center">
                <span className="text-[10px] font-black text-blue-500 uppercase tracking-widest mb-1">สัดส่วน Telemedicine</span>
                <div className="relative w-full h-full flex items-center justify-center">
                  <svg viewBox="0 0 100 60" className="w-full">
                    <path d="M 10 50 A 40 40 0 0 1 90 50" fill="none" stroke="#f1f5f9" strokeWidth="12" strokeLinecap="round" />
                    <motion.path
                      initial={{ pathLength: 0 }}
                      animate={{ pathLength: (subhTotals?.percentType5 || 0) / 100 }}
                      transition={{ duration: 2, ease: "circOut" }}
                      d="M 10 50 A 40 40 0 0 1 90 50"
                      fill="none"
                      stroke="url(#subhCornerGradient)"
                      strokeWidth="12"
                      strokeLinecap="round"
                    />
                    <defs>
                      <linearGradient id="subhCornerGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                        <stop offset="0%" stopColor="#3b82f6" />
                        <stop offset="100%" stopColor="#2563eb" />
                      </linearGradient>
                    </defs>
                  </svg>
                  <div className="absolute inset-0 flex items-center justify-center pt-6">
                    <span className="text-lg font-black text-blue-600 tabular-nums">
                      {subhTotals?.percentType5.toFixed(2)}%
                    </span>
                  </div>
                </div>
              </div>

              <div className="flex flex-col gap-2 bg-slate-50 px-4 py-3 rounded-2xl border border-white">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-violet-600" />
                  <span className="text-[10px] font-black text-slate-500">DASHBOARD</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-emerald-500" />
                  <span className="text-[10px] font-black text-slate-500">HDC</span>
                </div>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-3 mt-8">
            {top10Data.map((item: any, idx: number) => (
              <div
                key={idx}
                className="flex items-center justify-between p-3 rounded-2xl bg-slate-50/50 border border-white hover:bg-white hover:shadow-lg hover:shadow-indigo-500/5 transition-all duration-300 group"
              >
                <div className="flex items-center gap-4 overflow-hidden">
                  <div className="w-8 h-8 rounded-xl flex items-center justify-center text-xs font-black shrink-0 transition-all shadow-sm bg-white text-indigo-600 border border-slate-100 group-hover:bg-indigo-600 group-hover:text-white">
                    {idx + 1}
                  </div>
                  <div className="min-w-0">
                    <p className="text-[13px] font-black text-slate-700 truncate uppercase tracking-tight">
                      {item.name}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-4 shrink-0 pl-4">
                  <div className="text-right">
                    <p className="text-xs font-bold text-violet-500 uppercase leading-none mb-1">Dashboard</p>
                    <p className="text-xl font-black text-violet-700 tabular-nums leading-none">
                      {item.dashboard.toLocaleString()}
                    </p>
                  </div>
                  <div className="w-[1px] h-8 bg-slate-200" />
                  <div className="text-right">
                    <p className="text-xs font-bold text-emerald-500 uppercase leading-none mb-1">HDC</p>
                    <p className="text-xl font-black text-emerald-700 tabular-nums leading-none">
                      {item.hdc.toLocaleString()}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </SoftCard>
      </motion.div>

      {/* Footer Branding */}
      <div className="pt-10 flex justify-center opacity-30 hover:opacity-100 transition-opacity">
        <div className="flex items-center gap-3">
          <div className="h-[1px] w-12 bg-slate-400" />
          <span className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Onepage Telemedicine Phitsanulok</span>
          <div className="h-[1px] w-12 bg-slate-400" />
        </div>
      </div>

    </motion.div>
  );
}
