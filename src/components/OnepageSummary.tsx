"use client";

import React from 'react';
import {
  PieChart, Pie, Cell, Tooltip,
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Legend, ResponsiveContainer, LabelList
} from 'recharts';
import { motion } from 'framer-motion';
import SoftCard from './ui/SoftCard';

export default function OnepageSummary({ data }: { data: any }) {
  const { pie, totals, formattedDate, districtData, hospitalData, top10Data } = data;

  const COLORS = {
    dashboard: '#7C3AED', // Vivid Violet
    hdc: '#059669',      // Emerald Green
    type2: '#A78BFA',    // Light Purple
    type3: '#F87171',    // Red
    type5: '#3B82F6',    // Blue
  };

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  };

  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: {
      y: 0,
      opacity: 1,
      transition: { type: 'spring', stiffness: 100 }
    }
  };

  const renderCustomizedLabel = (props: any) => {
    const { x, y, width, value } = props;
    if (value === 0) return null;
    return (
      <text x={x + width + 5} y={y + 12} fill="#4B5563" fontSize={10} fontWeight="bold" textAnchor="start">
        {value.toLocaleString()}
      </text>
    );
  };

  const renderVerticalLabel = (props: any) => {
    const { x, y, width, value } = props;
    if (value === 0) return null;
    return (
      <text x={x + width / 2} y={y - 8} fill="#4B5563" fontSize={10} fontWeight="bold" textAnchor="middle">
        {value.toLocaleString()}
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
      initial="hidden"
      animate="visible"
      variants={containerVariants}
      className="w-full max-w-[1400px] mx-auto p-4 md:p-10 space-y-8"
    >

      {/* Header Section */}
      <motion.div variants={itemVariants} className="flex flex-col md:flex-row justify-between items-center gap-6 mb-4">
        <div className="flex items-center gap-6">
          <div className="w-16 h-16 bg-white rounded-2xl shadow-nm-protrude flex items-center justify-center p-2">
            <img src="/telemedicine/logo-moph.png" alt="MOPH" className="w-full h-full object-contain" />
          </div>
          <div>
            <h1 className="text-3xl md:text-4xl font-black text-indigo-950 tracking-tighter leading-none">
              ผลงาน Telemedicine <span className="text-emerald-600">จังหวัดพิษณุโลก</span>
            </h1>
            <p className="text-sm font-bold text-slate-400 uppercase tracking-[0.2em] mt-1">
              กลุ่มงานสุขภาพดิจิทัล
            </p>
          </div>
        </div>
        <div className="flex flex-col items-end gap-2">
          <div className="bg-white px-6 py-2 rounded-2xl shadow-nm-protrude border border-white/50 flex items-center gap-3">
            <span className="text-[10px] font-black text-indigo-400 uppercase tracking-widest">Update</span>
            <span className="text-sm font-black text-indigo-900 tabular-nums">
              {formattedDate}
            </span>
          </div>
          <p className="text-[10px] font-bold text-indigo-300 uppercase tracking-wider">
            แหล่งข้อมูล: ระบบ HIS และ HDC
          </p>
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
              สัดส่วนประเภทการมารับบริการ
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
                  className="flex flex-col items-center p-3 rounded-2xl border transition-all duration-300 shadow-sm"
                  style={{
                    backgroundColor: item.fill + '40', // ~25% opacity
                    borderColor: item.fill + '80',      // ~50% opacity
                  }}
                >
                  <span className="text-[9px] font-black uppercase tracking-tighter mb-1 text-slate-700">
                    {item.name.split('(')[0]}
                  </span>
                  <span className="text-sm font-black text-slate-950">
                    {((item.value / totals.total235) * 100).toFixed(1)}%
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

            <div className="flex justify-between items-start mb-8">
              <div>
                <h3 className="text-lg font-black text-indigo-950 flex items-center gap-2">
                  <div className="w-1.5 h-6 bg-emerald-600 rounded-full" />
                  สัดส่วนการใช้ Telemedicine
                </h3>
              </div>
              <div className="text-right">
                <span className="text-4xl font-black text-indigo-600 italic tracking-tighter drop-shadow-sm">
                  {totals.percentType5.toFixed(2)}%
                </span>
              </div>
            </div>

            <div className="flex-1 flex items-center gap-10">
              <div className="relative w-32 h-48 bg-slate-100 rounded-[2rem] overflow-hidden shadow-nm-inset border-4 border-white flex flex-col-reverse">
                <motion.div
                  initial={{ height: 0 }}
                  animate={{ height: `${totals.percentType5}%` }}
                  transition={{ duration: 1.5, ease: "easeOut" }}
                  className="bg-gradient-to-t from-indigo-600 to-blue-400 w-full relative"
                >
                  <div className="absolute -top-4 left-0 w-full h-8 bg-blue-400/30 blur-md animate-pulse" />
                </motion.div>

                <div className="absolute inset-0 flex flex-col justify-between py-6 items-center pointer-events-none">
                  <span className="text-[10px] font-black text-white mix-blend-overlay">TYPE 5</span>
                  <span className="text-[10px] font-black text-indigo-300">TOTAL</span>
                </div>
              </div>

              <div className="flex-1 space-y-6">
                <div className="p-5 rounded-3xl bg-indigo-50/80 border border-indigo-100 shadow-sm group-hover:shadow-md transition-shadow">
                  <span className="text-[10px] font-black text-indigo-400 uppercase tracking-widest block mb-1">แพทย์ทางไกล (TYPE 5)</span>
                  <div className="flex items-baseline gap-2">
                    <span className="text-3xl font-black text-indigo-900 tabular-nums">{totals.type5.toLocaleString()}</span>
                    <span className="text-xs font-bold text-indigo-400 uppercase">ครั้ง</span>
                  </div>
                </div>
                <div className="p-5 rounded-3xl bg-emerald-50/80 border border-emerald-100 shadow-sm group-hover:shadow-md transition-shadow">
                  <span className="text-[10px] font-black text-emerald-500 uppercase tracking-widest block mb-1">รวมงาน HIS (2,3,5)</span>
                  <div className="flex items-baseline gap-2">
                    <span className="text-3xl font-black text-emerald-900 tabular-nums">{totals.total235.toLocaleString()}</span>
                    <span className="text-xs font-bold text-emerald-400 uppercase">ครั้ง</span>
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
          <SoftCard className="p-6">
            <div className="flex items-center justify-between mb-8 px-2">
              <h3 className="text-lg font-black text-indigo-950 flex items-center gap-2">
                <div className="w-1.5 h-6 bg-purple-600 rounded-full" />
                ผลงานรายอำเภอ
              </h3>
              <div className="flex gap-4">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-emerald-500" />
                  <span className="text-[10px] font-bold text-slate-500 uppercase">HDC</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-violet-600" />
                  <span className="text-[10px] font-bold text-slate-500 uppercase">Dashboard</span>
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
                  width={100}
                  tick={{ fontSize: 11, fill: '#64748b', fontWeight: 800 }}
                  axisLine={false}
                  tickLine={false}
                />
                <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(0,0,0,0.02)' }} />
                <Bar dataKey="hdc" name="HDC" fill={COLORS.hdc} barSize={14} radius={[0, 10, 10, 0]}>
                  <LabelList dataKey="hdc" content={renderCustomizedLabel} />
                </Bar>
                <Bar dataKey="dashboard" name="Dashboard" fill={COLORS.dashboard} barSize={14} radius={[0, 10, 10, 0]}>
                  <LabelList dataKey="dashboard" content={renderCustomizedLabel} />
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </SoftCard>
        </motion.div>

        {/* Hospital Chart */}
        <motion.div variants={itemVariants}>
          <SoftCard className="p-6">
            <div className="flex items-center justify-between mb-8 px-2">
              <h3 className="text-lg font-black text-indigo-950 flex items-center gap-2">
                <div className="w-1.5 h-6 bg-blue-600 rounded-full" />
                ผลงานรายโรงพยาบาล
              </h3>
              <div className="flex gap-4">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-emerald-500" />
                  <span className="text-[10px] font-bold text-slate-500 uppercase">HDC</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-violet-600" />
                  <span className="text-[10px] font-bold text-slate-500 uppercase">Dashboard</span>
                </div>
              </div>
            </div>

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
                  width={120}
                  tick={{ fontSize: 11, fill: '#64748b', fontWeight: 800 }}
                  axisLine={false}
                  tickLine={false}
                />
                <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(0,0,0,0.02)' }} />
                <Bar dataKey="hdc" name="HDC" fill={COLORS.hdc} barSize={12} radius={[0, 10, 10, 0]}>
                  <LabelList dataKey="hdc" content={renderCustomizedLabel} />
                </Bar>
                <Bar dataKey="dashboard" name="Dashboard" fill={COLORS.dashboard} barSize={12} radius={[0, 10, 10, 0]}>
                  <LabelList dataKey="dashboard" content={renderCustomizedLabel} />
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </SoftCard>
        </motion.div>
      </div>

      {/* Bottom Rankings Section */}
      <motion.div variants={itemVariants}>
        <SoftCard className="p-8">
          <div className="flex flex-col md:flex-row justify-between items-end mb-10 px-2 gap-4">
            <div>
              <h3 className="text-xl font-black text-indigo-950 flex items-center gap-3">
                <div className="p-2 bg-amber-100 rounded-xl">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#D97706" strokeWidth="3">
                    <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
                  </svg>
                </div>
                10 อันดับหน่วยบริการ
              </h3>
              <p className="text-[11px] font-black text-slate-400 uppercase tracking-widest mt-1 ml-11">Sorted by Dashboard Transactions</p>
            </div>
            <div className="flex items-center gap-6 bg-slate-50 px-6 py-2 rounded-2xl border border-white">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-violet-600" />
                <span className="text-[10px] font-black text-slate-500">DASHBOARD</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-emerald-500" />
                <span className="text-[10px] font-black text-slate-500">HDC (HIS)</span>
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
                  <div className="w-8 h-8 rounded-xl bg-white shadow-sm border border-slate-100 flex items-center justify-center text-xs font-black text-indigo-600 shrink-0 group-hover:bg-indigo-600 group-hover:text-white transition-colors">
                    {idx + 1}
                  </div>
                  <div className="min-w-0">
                    <p className="text-[12px] font-black text-slate-700 truncate uppercase tracking-tight">
                      {item.name}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-4 shrink-0 pl-4">
                  <div className="text-right">
                    <p className="text-[10px] font-bold text-violet-500 uppercase leading-none mb-1">Dashboard</p>
                    <p className="text-sm font-black text-violet-700 tabular-nums leading-none">
                      {item.dashboard.toLocaleString()}
                    </p>
                  </div>
                  <div className="w-[1px] h-6 bg-slate-200" />
                  <div className="text-right">
                    <p className="text-[10px] font-bold text-emerald-500 uppercase leading-none mb-1">HDC</p>
                    <p className="text-sm font-black text-emerald-700 tabular-nums leading-none">
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
          <span className="text-[10px] font-black text-slate-400 uppercase tracking-[0.5em]">Telemed PLK Dashboard</span>
          <div className="h-[1px] w-12 bg-slate-400" />
        </div>
      </div>

    </motion.div>
  );
}
