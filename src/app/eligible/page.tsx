import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import pool from "@/lib/db";
import Link from "next/link";
import SoftCard from "@/components/ui/SoftCard";
import { getTargetYear } from "@/lib/targetYear";

export const dynamic = "force-dynamic";

interface DistrictEligible {
  amp_code: string;
  amp_name: string;
  hospital_count: number;
  total_result: number;
  target_100: number;
  target_30: number;
  percent_100: number;
  percent_30: number;
  missing_100: number;
  missing_30: number;
}

async function getEligibleData(fiscalYear: string = "2569") {
  try {
    const targetYear = await getTargetYear(fiscalYear);
    const query = `
      SELECT 
        a.amp_code,
        a.amp_name,
        COUNT(DISTINCT h.hospcode) AS hospital_count,
        COALESCE(SUM(p.result), 0) AS total_result,
        COALESCE(SUM(tgt.target_100), 0) AS target_100,
        COALESCE(SUM(tgt.target_30), 0) AS target_30
      FROM ampur a
      LEFT JOIN hospital h
        ON h.amp_code = a.amp_code COLLATE utf8mb4_general_ci
        AND h.status = '1'
      LEFT JOIN (
        SELECT 
          hospcode, 
          CEILING(COALESCE(op, 0)) AS target_100,
          CEILING(COALESCE(op_30, 0)) AS target_30
        FROM target
        WHERE b_year = '${targetYear}'
      ) tgt ON tgt.hospcode = h.hospcode COLLATE utf8mb4_general_ci
      LEFT JOIN (
        SELECT hospcode, result
        FROM telemed
        WHERE b_year = '${fiscalYear}'
      ) p ON p.hospcode = h.hospcode COLLATE utf8mb4_general_ci
      GROUP BY a.amp_code, a.amp_name
      ORDER BY a.amp_code ASC
    `;

    const [rows]: any = await pool.query(query);

    const districts: DistrictEligible[] = (rows || []).map((row: any) => {
      const result = Number(row.total_result) || 0;
      const target100 = Number(row.target_100) || 0;
      const target30 = Number(row.target_30) || 0;
      const percent100 = target100 > 0 ? (result / target100) * 100 : 0;
      const percent30 = target30 > 0 ? (result / target30) * 100 : 0;
      const missing100 = Math.max(0, target100 - result);
      const missing30 = Math.max(0, target30 - result);

      return {
        amp_code: row.amp_code,
        amp_name: row.amp_name,
        hospital_count: Number(row.hospital_count) || 0,
        total_result: result,
        target_100: target100,
        target_30: target30,
        percent_100: percent100,
        percent_30: percent30,
        missing_100: missing100,
        missing_30: missing30,
      };
    });

    const totals = districts.reduce(
      (acc, curr) => {
        acc.hospital_count += curr.hospital_count;
        acc.total_result += curr.total_result;
        acc.target_100 += curr.target_100;
        acc.target_30 += curr.target_30;
        return acc;
      },
      {
        hospital_count: 0,
        total_result: 0,
        target_100: 0,
        target_30: 0,
      }
    );

    const totalPercent100 = totals.target_100 > 0 ? (totals.total_result / totals.target_100) * 100 : 0;
    const totalPercent30 = totals.target_30 > 0 ? (totals.total_result / totals.target_30) * 100 : 0;
    const totalMissing100 = Math.max(0, totals.target_100 - totals.total_result);
    const totalMissing30 = Math.max(0, totals.target_30 - totals.total_result);

    return {
      districts,
      totals: {
        ...totals,
        percent_100: totalPercent100,
        percent_30: totalPercent30,
        missing_100: totalMissing100,
        missing_30: totalMissing30,
      },
    };
  } catch (error) {
    console.error("Error fetching eligible data:", error);
    return {
      districts: [],
      totals: {
        hospital_count: 0,
        total_result: 0,
        target_100: 0,
        target_30: 0,
        percent_100: 0,
        percent_30: 0,
        missing_100: 0,
        missing_30: 0,
      },
    };
  }
}

export default async function EligiblePage({
  searchParams,
}: {
  searchParams: Promise<{ year?: string }>;
}) {
  const params = await searchParams;
  const fiscalYear = params.year === "2570" ? "2570" : "2569";
  const { districts, totals } = await getEligibleData(fiscalYear);

  return (
    <main className="min-h-screen flex flex-col bg-slate-50">
      <Navbar showFilters={false} />

      <section className="px-4 md:px-6 mt-4 flex-1">
        <div className="mx-auto max-w-[1600px] space-y-4">
          {/* Header Card */}
          <div className="rounded-2xl border border-slate-200/80 bg-white/80 backdrop-blur px-5 py-4 shadow-sm">
            <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
              <div>
                <div className="flex items-center gap-3">
                  <div className="p-2.5 bg-emerald-50 text-emerald-600 rounded-xl border border-emerald-100/60 shadow-sm">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <div>
                    <h1 className="text-xl md:text-2xl font-black text-slate-900 tracking-tight">
                      กลุ่มเป้าหมาย (Eligible)
                    </h1>
                    <p className="text-xs font-semibold text-slate-500">
                      ติดตามเป้าหมายและการเข้าถึงบริการ Telemedicine จังหวัดพิษณุโลก
                    </p>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-3 flex-wrap">
                {/* Year Switcher */}
                <div className="flex items-center bg-slate-100 p-1 rounded-xl border border-slate-200 shadow-inner">
                  <a
                    href="/eligible?year=2570"
                    className={`px-3 py-1.5 rounded-lg text-xs font-black transition-all flex items-center gap-1.5 ${
                      fiscalYear === "2570"
                        ? "bg-white text-purple-700 shadow-sm border border-slate-200/50"
                        : "text-slate-500 hover:text-slate-800"
                    }`}
                  >
                    <span className={`w-2 h-2 rounded-full ${fiscalYear === "2570" ? "bg-purple-500 animate-pulse" : "bg-slate-300"}`} />
                    ปีงบ 2570
                  </a>
                  <a
                    href="/eligible?year=2569"
                    className={`px-3 py-1.5 rounded-lg text-xs font-black transition-all flex items-center gap-1.5 ${
                      fiscalYear === "2569"
                        ? "bg-white text-indigo-700 shadow-sm border border-slate-200/50"
                        : "text-slate-500 hover:text-slate-800"
                    }`}
                  >
                    <span className={`w-2 h-2 rounded-full ${fiscalYear === "2569" ? "bg-indigo-500" : "bg-slate-300"}`} />
                    ปีงบ 2569
                  </a>
                </div>

                <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-black bg-emerald-50 text-emerald-700 border border-emerald-100">
                  <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                  {fiscalYear === "2570" ? "เป้าหมายปีงบประมาณ 2570 (อ้างอิงเป้าเดิม)" : "เป้าหมายปีงบประมาณ 2569"}
                </span>
              </div>
            </div>
          </div>

          {/* KPI Summary Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
            {/* 100% Target Card */}
            <div className="nm-card p-4 rounded-2xl border border-slate-100 bg-white">
              <div className="flex items-center justify-between mb-2">
                <span className="text-[11px] font-black uppercase tracking-wider text-slate-400">เป้าหมายทั้งหมด (100%)</span>
                <span className="p-1.5 rounded-lg bg-rose-50 text-rose-600">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                    <circle cx="12" cy="12" r="10" />
                    <circle cx="12" cy="12" r="6" />
                    <circle cx="12" cy="12" r="2" />
                  </svg>
                </span>
              </div>
              <div className="text-2xl font-black text-slate-800 tracking-tight">
                {totals.target_100.toLocaleString()}
                <span className="text-xs font-bold text-slate-400 ml-1.5">ครั้ง</span>
              </div>
              <div className="mt-2 text-[11px] font-semibold text-slate-500 flex items-center justify-between">
                <span>ผลงานปัจจุบัน</span>
                <span className="font-bold text-slate-700">{totals.total_result.toLocaleString()} ({totals.percent_100.toFixed(1)}%)</span>
              </div>
            </div>

            {/* 30% Target Card */}
            <div className="nm-card p-4 rounded-2xl border border-slate-100 bg-white">
              <div className="flex items-center justify-between mb-2">
                <span className="text-[11px] font-black uppercase tracking-wider text-slate-400">เป้าหมายขั้นต่ำ (30%)</span>
                <span className="p-1.5 rounded-lg bg-amber-50 text-amber-600">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                    <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                    <polyline points="22 4 12 14.01 9 11.01" />
                  </svg>
                </span>
              </div>
              <div className="text-2xl font-black text-slate-800 tracking-tight">
                {totals.target_30.toLocaleString()}
                <span className="text-xs font-bold text-slate-400 ml-1.5">ครั้ง</span>
              </div>
              <div className="mt-2 text-[11px] font-semibold text-slate-500 flex items-center justify-between">
                <span>ความสำเร็จเทียบ 30%</span>
                <span className={`font-bold ${totals.percent_30 >= 100 ? 'text-emerald-600' : 'text-amber-600'}`}>
                  {totals.percent_30.toFixed(1)}%
                </span>
              </div>
            </div>

            {/* Missing 100% Card */}
            <div className="nm-card p-4 rounded-2xl border border-slate-100 bg-white">
              <div className="flex items-center justify-between mb-2">
                <span className="text-[11px] font-black uppercase tracking-wider text-slate-400">ผลงานขาดอีก (100%)</span>
                <span className="p-1.5 rounded-lg bg-rose-50 text-rose-500">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                    <path d="M22 12h-4l-3 9L9 3l-3 9H2" />
                  </svg>
                </span>
              </div>
              <div className="text-2xl font-black text-rose-600 tracking-tight">
                {totals.missing_100.toLocaleString()}
                <span className="text-xs font-bold text-slate-400 ml-1.5">ครั้ง</span>
              </div>
              <div className="mt-2 text-[11px] font-semibold text-slate-500 flex items-center justify-between">
                <span>ขาดอีกเพื่อครบ 30%</span>
                <span className="font-bold text-amber-600">{totals.missing_30.toLocaleString()} ครั้ง</span>
              </div>
            </div>

            {/* Total Result Card */}
            <div className="nm-card p-4 rounded-2xl border border-slate-100 bg-white">
              <div className="flex items-center justify-between mb-2">
                <span className="text-[11px] font-black uppercase tracking-wider text-slate-400">ผลงานสะสมรวม</span>
                <span className="p-1.5 rounded-lg bg-emerald-50 text-emerald-600">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                </span>
              </div>
              <div className="text-2xl font-black text-emerald-600 tracking-tight">
                {totals.total_result.toLocaleString()}
                <span className="text-xs font-bold text-slate-400 ml-1.5">ครั้ง</span>
              </div>
              <div className="mt-2 text-[11px] font-semibold text-slate-500 flex items-center justify-between">
                <span>จำนวนหน่วยบริการ</span>
                <span className="font-bold text-slate-700">{totals.hospital_count} แห่ง</span>
              </div>
            </div>
          </div>

          {/* District Table */}
          <div className="rounded-2xl border border-slate-200/80 bg-white shadow-sm overflow-hidden">
            <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-emerald-500" />
                <h2 className="text-sm font-black text-slate-800 uppercase tracking-wider">
                  จำแนกตามอำเภอ (District Breakdown)
                </h2>
              </div>
              <span className="text-xs font-semibold text-slate-400">
                ทั้งหมด {districts.length} อำเภอ
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-sm">
                <thead>
                  <tr className="bg-slate-50/80 text-slate-600 text-xs font-black uppercase tracking-wider border-b border-slate-100">
                    <th className="py-3 px-4">อำเภอ</th>
                    <th className="py-3 px-4 text-center">หน่วยบริการ</th>
                    <th className="py-3 px-4 text-right">เป้าหมาย 100%</th>
                    <th className="py-3 px-4 text-right">เป้าหมาย 30%</th>
                    <th className="py-3 px-4 text-right">ผลงานสะสม</th>
                    <th className="py-3 px-4 text-right">% ความสำเร็จ (100%)</th>
                    <th className="py-3 px-4 text-right">% ความสำเร็จ (30%)</th>
                    <th className="py-3 px-4 text-right">ขาดอีก (100%)</th>
                    <th className="py-3 px-4 text-center">สถานะ</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-medium">
                  {districts.map((d) => {
                    const is30Passed = d.total_result >= d.target_30 && d.target_30 > 0;
                    const is100Passed = d.total_result >= d.target_100 && d.target_100 > 0;

                    return (
                      <tr key={d.amp_code} className="hover:bg-slate-50/60 transition-colors">
                        <td className="py-3 px-4">
                          <Link
                            href={`/hospital?amp_code=${d.amp_code}`}
                            className="font-bold text-slate-800 hover:text-emerald-600 transition-colors"
                          >
                            {d.amp_name}
                          </Link>
                        </td>
                        <td className="py-3 px-4 text-center text-slate-600">
                          {d.hospital_count}
                        </td>
                        <td className="py-3 px-4 text-right font-semibold text-slate-700">
                          {d.target_100.toLocaleString()}
                        </td>
                        <td className="py-3 px-4 text-right font-semibold text-slate-700">
                          {d.target_30.toLocaleString()}
                        </td>
                        <td className="py-3 px-4 text-right font-bold text-emerald-600">
                          {d.total_result.toLocaleString()}
                        </td>
                        <td className="py-3 px-4 text-right font-bold text-slate-800">
                          {d.percent_100.toFixed(2)}%
                        </td>
                        <td className="py-3 px-4 text-right font-bold">
                          <span className={is30Passed ? "text-emerald-600" : "text-amber-600"}>
                            {d.percent_30.toFixed(2)}%
                          </span>
                        </td>
                        <td className="py-3 px-4 text-right font-semibold text-rose-600">
                          {d.missing_100.toLocaleString()}
                        </td>
                        <td className="py-3 px-4 text-center">
                          {is100Passed ? (
                            <span className="px-2.5 py-1 rounded-full text-[11px] font-black bg-emerald-100 text-emerald-800">
                              ผ่าน 100%
                            </span>
                          ) : is30Passed ? (
                            <span className="px-2.5 py-1 rounded-full text-[11px] font-black bg-blue-100 text-blue-800">
                              ผ่าน 30%
                            </span>
                          ) : (
                            <span className="px-2.5 py-1 rounded-full text-[11px] font-black bg-amber-100 text-amber-800">
                              กำลังดำเนินงาน
                            </span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
                <tfoot>
                  <tr className="bg-slate-100/80 font-black text-slate-900 border-t border-slate-200">
                    <td className="py-3 px-4">รวมทั้งจังหวัด</td>
                    <td className="py-3 px-4 text-center">{totals.hospital_count}</td>
                    <td className="py-3 px-4 text-right">{totals.target_100.toLocaleString()}</td>
                    <td className="py-3 px-4 text-right">{totals.target_30.toLocaleString()}</td>
                    <td className="py-3 px-4 text-right text-emerald-700">{totals.total_result.toLocaleString()}</td>
                    <td className="py-3 px-4 text-right">{totals.percent_100.toFixed(2)}%</td>
                    <td className="py-3 px-4 text-right text-emerald-700">{totals.percent_30.toFixed(2)}%</td>
                    <td className="py-3 px-4 text-right text-rose-700">{totals.missing_100.toLocaleString()}</td>
                    <td className="py-3 px-4 text-center">
                      <span className="px-2.5 py-1 rounded-full text-[11px] font-black bg-indigo-100 text-indigo-800">
                        ภาพรวมจังหวัด
                      </span>
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </main>
  );
}
