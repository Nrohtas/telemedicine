import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import pool from "@/lib/db";
import LastUpdate from "@/components/LastUpdate";
import Link from "next/link";
import TopPerformance from "@/components/TopPerformance";

export const dynamic = "force-dynamic";

interface DailyDistrictRow {
  amp_code: string;
  amp_name: string;
  platform_target: number;
  platform_result: number;
  platform_percent: number;
  visit_type_2: number;
  visit_type_3: number;
  visit_type_5: number;
  total: number;
  percent: number;
  hdc_opd: number;
  hdc_result: number;
  hdc_percent: number;
  diff_platform_his: number;
  diff_hdc_his: number;
  latest_date: string | null;
}

interface DailyTotals {
  platform_target: number;
  platform_result: number;
  visit_type_2: number;
  visit_type_3: number;
  visit_type_5: number;
  total: number;
  hdc_opd: number;
  hdc_result: number;
}

const numberFormat = new Intl.NumberFormat("th-TH");
const percentFormat = new Intl.NumberFormat("th-TH", {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

function formatCurrentThaiDate() {
  return new Date().toLocaleDateString("th-TH", {
    timeZone: "Asia/Bangkok",
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

async function getDailyDistrictRows(sortBy: string = "amp_code", sortOrder: string = "ASC"): Promise<DailyDistrictRow[]> {
  const allowedSortColumns = [
    "amp_code",
    "amp_name",
    "platform_target",
    "platform_result",
    "platform_percent",
    "visit_type_2",
    "visit_type_3",
    "visit_type_5",
    "total",
    "percent",
    "hdc_opd",
    "hdc_result",
    "hdc_percent",
    "diff_platform_his",
    "diff_hdc_his",
  ];
  const finalSortBy = allowedSortColumns.includes(sortBy) ? sortBy : "amp_code";
  const finalSortOrder = sortOrder.toUpperCase() === "DESC" ? "DESC" : "ASC";

  const query = `
    SELECT
      a.amp_code,
      a.amp_name,
      COALESCE(SUM(tgt.target_raw), 0) AS platform_target,
      COALESCE(SUM(p.result), 0) AS platform_result,
      CASE
        WHEN COALESCE(SUM(tgt.target_raw), 0) > 0
        THEN COALESCE(SUM(p.result), 0) / COALESCE(SUM(tgt.target_raw), 0) * 100
        ELSE 0
      END AS platform_percent,
      COALESCE(SUM(vtd.visit_type_2), 0) AS visit_type_2,
      COALESCE(SUM(vtd.visit_type_3), 0) AS visit_type_3,
      COALESCE(SUM(vtd.visit_type_5), 0) AS visit_type_5,
      (
        COALESCE(SUM(vtd.visit_type_2), 0) +
        COALESCE(SUM(vtd.visit_type_3), 0) +
        COALESCE(SUM(vtd.visit_type_5), 0)
      ) AS total,
      CASE
        WHEN (
          COALESCE(SUM(vtd.visit_type_2), 0) +
          COALESCE(SUM(vtd.visit_type_3), 0) +
          COALESCE(SUM(vtd.visit_type_5), 0)
        ) > 0
        THEN COALESCE(SUM(vtd.visit_type_5), 0) /
          (
            COALESCE(SUM(vtd.visit_type_2), 0) +
            COALESCE(SUM(vtd.visit_type_3), 0) +
            COALESCE(SUM(vtd.visit_type_5), 0)
          ) * 100
        ELSE 0
      END AS percent,
      COALESCE(SUM(hdc.opd), 0) AS hdc_opd,
      COALESCE(SUM(hdc.telemedicine), 0) AS hdc_result,
      CASE
        WHEN COALESCE(SUM(hdc.opd), 0) > 0
        THEN COALESCE(SUM(hdc.telemedicine), 0) / COALESCE(SUM(hdc.opd), 0) * 100
        ELSE 0
      END AS hdc_percent,
      COALESCE(SUM(vtd.visit_type_5), 0) - COALESCE(SUM(p.result), 0) AS diff_platform_his,
      COALESCE(SUM(hdc.telemedicine), 0) - COALESCE(SUM(vtd.visit_type_5), 0) AS diff_hdc_his,
      latest.latest_date,
      latest_t.latest_time
    FROM ampur a
    LEFT JOIN hospital h
      ON h.amp_code = a.amp_code
      AND h.status = '1'
    LEFT JOIN (
      SELECT hospcode, op_30 AS target_raw
      FROM target
      WHERE b_year = '2568'
    ) tgt ON tgt.hospcode = h.hospcode
    LEFT JOIN (
      SELECT hospcode, result
      FROM telemed
      WHERE b_year = '2569'
    ) p ON p.hospcode = h.hospcode
    LEFT JOIN (
      SELECT MAX(visit_date) AS latest_date
      FROM visit_type_daily
    ) latest ON 1 = 1
    LEFT JOIN (
      SELECT MAX(d_update) AS latest_time
      FROM visit_type_daily
    ) latest_t ON 1 = 1
    LEFT JOIN (
      SELECT
        hoscode,
        COALESCE(SUM(visit_type_2), 0) AS visit_type_2,
        COALESCE(SUM(visit_type_3), 0) AS visit_type_3,
        COALESCE(SUM(visit_type_5), 0) AS visit_type_5
      FROM visit_type_daily
      WHERE visit_date BETWEEN '2026-03-23' AND CURDATE()
      GROUP BY hoscode
    ) vtd ON vtd.hoscode = h.hospcode
    LEFT JOIN telemed_opd_hdc hdc
      ON hdc.hospcode = h.hospcode
      AND hdc.b_year = '2569'
    GROUP BY a.amp_code, a.amp_name, latest.latest_date, latest_t.latest_time
    ORDER BY ${finalSortBy} ${finalSortOrder}
  `;

  const [rows]: any = await pool.query(query);

  return rows.map((row: any): DailyDistrictRow => ({
    amp_code: row.amp_code,
    amp_name: row.amp_name,
    platform_target: Number(row.platform_target) || 0,
    platform_result: Number(row.platform_result) || 0,
    platform_percent: Number(row.platform_percent) || 0,
    visit_type_2: Number(row.visit_type_2) || 0,
    visit_type_3: Number(row.visit_type_3) || 0,
    visit_type_5: Number(row.visit_type_5) || 0,
    total: Number(row.total) || 0,
    percent: Number(row.percent) || 0,
    hdc_opd: Number(row.hdc_opd) || 0,
    hdc_result: Number(row.hdc_result) || 0,
    hdc_percent: Number(row.hdc_percent) || 0,
    diff_platform_his: Number(row.diff_platform_his) || 0,
    diff_hdc_his: Number(row.diff_hdc_his) || 0,
    latest_date: row.latest_time || row.latest_date,
  }));
}

async function getHdcLatestUpdate(): Promise<string | null> {
  try {
    const [rows]: any = await pool.query('SELECT MAX(hdc_update) as last_update FROM telemed_opd_hdc');
    return rows[0]?.last_update || null;
  } catch (err) {
    console.error('Error fetching HDC latest update:', err);
    return null;
  }
}

export default async function DailyPage({
  searchParams,
}: {
  searchParams: Promise<{ sort_by?: string; sort_order?: string }>;
}) {
  const params = await searchParams;
  const sortBy = params.sort_by ?? "amp_code";
  const sortOrder = params.sort_order ?? "ASC";

  const rows = await getDailyDistrictRows(sortBy, sortOrder);
  const hdcLastUpdate = await getHdcLatestUpdate();
  const hisLastUpdate = rows[0]?.latest_date || null;
  const totals = rows.reduce<DailyTotals>(
    (sum, row) => ({
      platform_target: sum.platform_target + row.platform_target,
      platform_result: sum.platform_result + row.platform_result,
      visit_type_2: sum.visit_type_2 + row.visit_type_2,
      visit_type_3: sum.visit_type_3 + row.visit_type_3,
      visit_type_5: sum.visit_type_5 + row.visit_type_5,
      total: sum.total + row.total,
      hdc_opd: sum.hdc_opd + row.hdc_opd,
      hdc_result: sum.hdc_result + row.hdc_result,
    }),
    { platform_target: 0, platform_result: 0, visit_type_2: 0, visit_type_3: 0, visit_type_5: 0, total: 0, hdc_opd: 0, hdc_result: 0 }
  );
  const platformTotalPercent = totals.platform_target > 0 ? (totals.platform_result / totals.platform_target) * 100 : 0;
  const totalPercent = totals.total > 0 ? (totals.visit_type_5 / totals.total) * 100 : 0;
  const hdcTotalPercent = totals.hdc_opd > 0 ? (totals.hdc_result / totals.hdc_opd) * 100 : 0;
  const totalDiffPlatformHis = totals.visit_type_5 - totals.platform_result;
  const totalDiffHdcHis = totals.hdc_result - totals.visit_type_5;
  const reportPeriodLabel = `ผลงานให้บริการแพทย์ทางไกล ข้อมูลระหว่าง 23 มีนาคม 2569 - ${formatCurrentThaiDate()}`;

  const getSortUrl = (column: string) => {
    const nextOrder = sortBy === column && sortOrder === "ASC" ? "DESC" : "ASC";
    return `/daily?sort_by=${column}&sort_order=${nextOrder}`;
  };

  const SortIcon = ({ column }: { column: string }) => {
    if (sortBy !== column) return <span className="ml-1 opacity-20">↕</span>;
    return <span className="ml-1">{sortOrder === "ASC" ? "↑" : "↓"}</span>;
  };

  return (
    <main className="min-h-screen bg-background pb-12">
      <Navbar showFilters={false} />

      <section className="px-3 md:px-6 mt-2 md:mt-3">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-3 sm:gap-0 mb-3 px-1">
          <h3 className="text-xl sm:text-2xl font-black text-[#1E1B4B] tracking-tight">สรุปรายอำเภอ</h3>
          <div className="flex items-center gap-4">
            <Link
              href="/daily/onepage"
              className="inline-flex items-center gap-2 bg-gradient-to-br from-indigo-500 to-indigo-600 text-white px-4 py-2 rounded-xl text-sm font-bold shadow-lg shadow-indigo-100 hover:scale-105 active:scale-95 transition-all"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                <polyline points="14 2 14 8 20 8"></polyline>
                <line x1="16" y1="13" x2="8" y2="13"></line>
                <line x1="16" y1="17" x2="8" y2="17"></line>
                <polyline points="10 9 9 9 8 9"></polyline>
              </svg>
              Onepage
            </Link>
          </div>
        </div>

        <div className="overflow-hidden rounded-[1.75rem] border border-slate-100 bg-white shadow-xl shadow-slate-900/5">
          <div className="border-b border-slate-100 bg-white px-5 py-3">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <p className="text-sm font-bold text-emerald-800 md:text-base">
                {reportPeriodLabel}
              </p>
              <div className="flex items-center gap-4 ml-auto">
                <div className="flex items-center gap-2 bg-blue-50 px-3 py-1.5 rounded-full border border-blue-100 shadow-sm">
                  <span className="text-[10px] font-black text-blue-800 uppercase tracking-widest whitespace-nowrap">HIS UPDATE :</span>
                  <span className="text-[11px] font-black text-blue-600 whitespace-nowrap uppercase">
                    {hisLastUpdate ? new Date(hisLastUpdate).toLocaleDateString('th-TH', { 
                        day: 'numeric', 
                        month: 'short', 
                        year: 'numeric',
                        calendar: 'buddhist' 
                      } as any) + ' ' + new Date(hisLastUpdate).toLocaleTimeString('th-TH', {
                        hour: '2-digit',
                        minute: '2-digit',
                        hour12: false
                      }) + ' น.' : '-'}
                  </span>
                </div>
                {hdcLastUpdate && (
                  <a 
                    href="https://app.powerbi.com/view?r=eyJrIjoiYjE4NGNjNzItYmM2ZS00MjFmLTlmNDEtOWQ1M2JiODk4N2M0IiwidCI6ImI3NmEyM2QzLThjZGYtNDNjMC1hNTNiLTYwYmNkMjM3OTg5NSIsImMiOjEwfQ%3D%3D"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 bg-emerald-50 px-3 py-1.5 rounded-full border border-emerald-100 shadow-sm hover:bg-emerald-100 transition-all duration-300 group hover:shadow-md"
                  >
                    <span className="text-[10px] font-black text-emerald-800 uppercase tracking-widest whitespace-nowrap">ที่มา :</span>
                    <span className="text-[11px] font-black text-emerald-600 whitespace-nowrap group-hover:text-emerald-800 transition-colors">HDC Update</span>
                    <span className="w-1 h-1 rounded-full bg-emerald-300"></span>
                    <span className="text-[10px] font-black text-emerald-500 uppercase tracking-tighter whitespace-nowrap">
                      {new Date(hdcLastUpdate).toLocaleDateString('th-TH', { 
                        day: 'numeric', 
                        month: 'short', 
                        year: 'numeric',
                        calendar: 'buddhist' 
                      } as any)}
                    </span>
                  </a>
                )}
              </div>
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[1400px] divide-y divide-slate-100">
              <thead className="bg-slate-50">
                <tr className="border-b border-slate-200 text-center text-[13px] font-black text-slate-600">
                  <th className="px-5 py-3 text-left" rowSpan={2}>
                    <Link href={getSortUrl("amp_name")} scroll={false} className="hover:text-emerald-600">
                      อำเภอ <SortIcon column="amp_name" />
                    </Link>
                  </th>
                  <th className="border-l-2 border-indigo-300 bg-indigo-50 px-5 py-3 text-indigo-700" colSpan={3}>
                    <div className="flex flex-col items-center gap-1">
                      <span className="text-[13px] font-black uppercase">ผลงาน PLATFORM</span>
                      <div className="text-[10px] font-bold opacity-80">
                        <a
                          href="https://datastudio.google.com/u/0/reporting/33f2a1d7-2f28-43b1-85ea-6cf3e8d579ac/page/p_q5mrcvqeyd"
                          target="_blank"
                          rel="noopener noreferrer"
                          className="hover:underline flex items-center gap-1.5"
                        >
                          <div className="p-0.5 rounded-md bg-emerald-50 shadow-sm ring-1 ring-emerald-100/50">
                            <svg width="12" height="12" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
                              <circle cx="50" cy="22" r="14" fill="#006837" />
                              <path d="M25 40H75V75C75 80 71 84 66 84H34C29 84 25 80 25 75V40Z" stroke="#F6D76E" strokeWidth="10" />
                              <rect x="40" y="52" width="20" height="7" fill="#A5A7AA" />
                              <rect x="46.5" y="46" width="7" height="19" fill="#A5A7AA" />
                            </svg>
                          </div>
                          <span>หมอพร้อม Station + สอน.บัดดี้</span>
                          <div className="p-0.5 rounded-md bg-sky-50 shadow-sm ring-1 ring-sky-100/50">
                            <svg width="12" height="12" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
                              <path d="M10 45L50 15L90 45" stroke="#00ADEF" strokeWidth="12" strokeLinecap="round" />
                              <rect x="40" y="32" width="20" height="7" fill="#A5A7AA" />
                              <rect x="46.5" y="26" width="7" height="19" fill="#A5A7AA" />
                              <path d="M25 55C25 55 25 85 50 85C75 85 75 60 75 60" stroke="#F6D76E" strokeWidth="10" fill="none" strokeLinecap="round" />
                              <circle cx="75" cy="62" r="8" fill="#0060A9" />
                            </svg>
                          </div>
                        </a>
                      </div>
                    </div>
                  </th>
                  <th className="border-l-2 border-cyan-300 bg-cyan-50 px-3 py-3 text-cyan-700" colSpan={5}>
                    ผลงาน HIS
                    <div className="flex justify-center mt-1">
                      <span className="text-[9px] font-black px-2 py-0.5 rounded-full bg-white/60 border border-cyan-200 text-cyan-800 shadow-sm">
                        ร้อยละ : ( (5) / รวม (2,3,5) ) × 100
                      </span>
                    </div>
                  </th>
                  <th className="border-l-2 border-emerald-300 bg-emerald-50 px-3 py-3 text-emerald-700" colSpan={3}>
                    ผลงาน HDC
                    <div className="flex justify-center mt-1">
                      <span className="text-[9px] font-black px-2 py-0.5 rounded-full bg-white/60 border border-emerald-200 text-emerald-800 shadow-sm">
                        ร้อยละ : ( Tele / OPD ) × 100
                      </span>
                    </div>
                  </th>
                  <th className="border-l-2 border-amber-300 bg-amber-50 px-3 py-3 text-amber-700" colSpan={2}>
                    ผลต่าง
                  </th>
                </tr>
                <tr className="border-b border-slate-200 text-left text-[11px] font-black uppercase tracking-tight text-slate-500">
                  <th className="border-l-2 border-indigo-300 bg-indigo-50/70 px-3 py-2 text-right">
                    <Link href={getSortUrl("platform_target")} scroll={false} className="hover:text-indigo-700">
                      เป้าหมาย <SortIcon column="platform_target" />
                    </Link>
                  </th>
                  <th className="bg-indigo-50/70 px-3 py-2 text-right">
                    <Link href={getSortUrl("platform_result")} scroll={false} className="hover:text-indigo-700">
                      ผลงาน <SortIcon column="platform_result" />
                    </Link>
                  </th>
                  <th className="bg-indigo-50/70 px-3 py-2 text-right">
                    <Link href={getSortUrl("platform_percent")} scroll={false} className="hover:text-indigo-700">
                      ร้อยละ <SortIcon column="platform_percent" />
                    </Link>
                  </th>
                  <th className="border-l-2 border-cyan-300 bg-cyan-50/70 px-3 py-2 text-right whitespace-nowrap">
                    <Link href={getSortUrl("visit_type_2")} scroll={false} className="hover:text-cyan-600">
                      มาตามนัด(2) <SortIcon column="visit_type_2" />
                    </Link>
                  </th>
                  <th className="bg-cyan-50/70 px-3 py-2 text-right whitespace-nowrap">
                    <Link href={getSortUrl("visit_type_3")} scroll={false} className="hover:text-cyan-600">
                      รับส่งต่อ(3) <SortIcon column="visit_type_3" />
                    </Link>
                  </th>
                  <th className="bg-cyan-50/70 px-3 py-2 text-right whitespace-nowrap">
                    <Link href={getSortUrl("visit_type_5")} scroll={false} className="hover:text-cyan-600">
                      Tele(5) <SortIcon column="visit_type_5" />
                    </Link>
                  </th>
                  <th className="bg-cyan-50/70 px-3 py-2 text-right whitespace-nowrap">
                    <Link href={getSortUrl("total")} scroll={false} className="hover:text-cyan-600">
                      รวม 2,3,5 <SortIcon column="total" />
                    </Link>
                  </th>
                  <th className="bg-cyan-50/70 px-3 py-2 text-right">
                    <Link href={getSortUrl("percent")} scroll={false} className="hover:text-cyan-600">
                      ร้อยละ <SortIcon column="percent" />
                    </Link>
                  </th>
                  <th className="border-l-2 border-emerald-300 bg-emerald-50/70 px-3 py-2 text-right">
                    <Link href={getSortUrl("hdc_opd")} scroll={false} className="hover:text-emerald-700">
                      OPD <SortIcon column="hdc_opd" />
                    </Link>
                  </th>
                  <th className="bg-emerald-50/70 px-3 py-2 text-right">
                    <Link href={getSortUrl("hdc_result")} scroll={false} className="hover:text-emerald-700">
                      Tele <SortIcon column="hdc_result" />
                    </Link>
                  </th>
                  <th className="bg-emerald-50/70 px-3 py-2 text-right">
                    <Link href={getSortUrl("hdc_percent")} scroll={false} className="hover:text-emerald-700">
                      ร้อยละ <SortIcon column="hdc_percent" />
                    </Link>
                  </th>
                  <th className="border-l-2 border-amber-300 bg-amber-50/70 px-3 py-2 text-right">
                    <Link href={getSortUrl("diff_hdc_platform")} scroll={false} className="hover:text-amber-700">
                      HDC - PLATFORM <SortIcon column="diff_hdc_platform" />
                    </Link>
                  </th>
                  <th className="bg-amber-50/70 px-3 py-2 text-right">
                    <Link href={getSortUrl("diff_hdc_his")} scroll={false} className="hover:text-amber-700">
                      HDC - HIS <SortIcon column="diff_hdc_his" />
                    </Link>
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {rows.map((row) => {
                  const diff_hdc_platform = row.hdc_result - row.platform_result;
                  const diff_hdc_his = row.hdc_result - row.total;
                  return (
                    <tr key={row.amp_code} className="group hover:bg-slate-50">
                    <td className="whitespace-nowrap px-5 py-2.5">
                      <Link
                        href={`/daily/hospital?amp_code=${encodeURIComponent(row.amp_code)}`}
                        className="flex items-center gap-2 font-black text-slate-900 underline-offset-4 group-hover:text-emerald-700 group-hover:underline decoration-emerald-500/30"
                      >
                        {row.amp_name}
                        <span className="opacity-0 group-hover:opacity-100 transition-all duration-300 transform translate-x-[-4px] group-hover:translate-x-0 bg-emerald-50 text-emerald-600 text-[10px] px-2 py-0.5 rounded-full border border-emerald-100 flex items-center gap-1">
                          <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 18 15 12 9 6"></polyline></svg>
                          หน่วยบริการ
                        </span>
                      </Link>
                    </td>
                    <NumberCell value={Math.round(row.platform_target)} className="border-l-2 border-indigo-200 bg-indigo-50/20" compact />
                    <NumberCell value={row.platform_result} className="bg-indigo-50/20" compact />
                    <PercentCell value={row.platform_percent} className="bg-indigo-50/20" color="indigo" />
                    <NumberCell value={row.visit_type_2} className="border-l-2 border-cyan-200 bg-cyan-50/10" />
                    <NumberCell value={row.visit_type_3} className="bg-cyan-50/10" />
                    <TelemedicineBadgeCell value={row.visit_type_5} color="cyan" size="sm" />
                    <NumberCell value={row.total} className="bg-cyan-50/10" />
                    <PercentCell value={row.percent} className="bg-cyan-50/10" color="cyan" />
                    <NumberCell value={row.hdc_opd} className="border-l-2 border-emerald-200 bg-emerald-50/30" />
                    <TelemedicineBadgeCell value={row.hdc_result} color="emerald" />
                    <PercentCell value={row.hdc_percent} className="bg-emerald-50/30 font-black text-emerald-900" color="emerald" />
                    <DiffCell value={diff_hdc_platform} className="border-l-2 border-amber-200 bg-amber-50/25" />
                    <DiffCell value={diff_hdc_his} className="bg-amber-50/25" />
                  </tr>
                    );
                  })}
              </tbody>
              <tfoot className="sticky bottom-0 z-10 bg-white border-t-2 border-slate-200 shadow-[0_-10px_20px_rgba(0,0,0,0.05)]">
                <tr className="text-center">
                  <td className="px-5 py-5 text-left font-black bg-slate-50">
                    <div className="flex items-center gap-3">
                      <div className="h-8 w-1.5 rounded-full bg-slate-400"></div>
                      <span className="text-base font-black text-slate-700">รวมทั้งจังหวัด</span>
                    </div>
                  </td>
                  <NumberCell value={Math.round(totals.platform_target)} footer compact className="bg-indigo-50/50 text-indigo-700 font-normal" />
                  <NumberCell value={totals.platform_result} footer compact className="bg-indigo-50/50 text-indigo-700 font-normal" />
                  <PercentCell value={platformTotalPercent} footer className="bg-indigo-50/50 text-blue-700 font-normal" color="indigo" />
                  <NumberCell value={totals.visit_type_2} footer className="bg-cyan-50/50 text-cyan-700 font-bold" />
                  <NumberCell value={totals.visit_type_3} footer className="bg-cyan-50/50 text-cyan-700 font-bold" />
                  <TelemedicineBadgeCell value={totals.visit_type_5} footer color="cyan" size="sm" />
                  <NumberCell value={totals.total} footer className="bg-cyan-50/50 text-cyan-700 font-bold" />
                  <PercentCell value={totalPercent} footer className="bg-cyan-50/50 text-cyan-700 font-bold" color="cyan" />
                  <NumberCell value={totals.hdc_opd} footer className="bg-emerald-50/50 text-emerald-700 font-black" />
                  <TelemedicineBadgeCell value={totals.hdc_result} footer color="emerald" />
                  <PercentCell value={hdcTotalPercent} footer className="bg-emerald-50/50 text-emerald-900 font-black" color="emerald" />
                  <DiffCell value={totals.hdc_result - totals.platform_result} footer className="bg-amber-50/50 text-amber-700 font-black" />
                  <DiffCell value={totals.hdc_result - totals.total} footer className="bg-amber-50/50 text-amber-700 font-black" />
                </tr>
              </tfoot>
            </table>
          </div>
        </div>
      </section>

      <section className="px-3 md:px-6 mt-8">
        <div className="mb-4 px-1">
          <h3 className="text-xl sm:text-2xl font-black text-[#1E1B4B] tracking-tight">10 อันดับหน่วยบริการ (แพทย์ทางไกล)</h3>
        </div>
        <TopPerformance />
      </section>

      <Footer />
    </main>
  );
}

function NumberCell({
  value,
  strong = false,
  footer = false,
  compact = false,
  className = "",
  showDecimal = false,
}: {
  value: number;
  strong?: boolean;
  footer?: boolean;
  compact?: boolean;
  className?: string;
  showDecimal?: boolean;
}) {
  const baseClassName = footer
    ? `px-3 py-4 text-right text-[12px] ${compact ? "font-bold text-slate-700" : "font-black text-slate-900"}`
    : `whitespace-nowrap px-3 py-2 text-right ${compact ? "text-[11px] font-medium text-slate-600" : strong ? "text-[13px] font-black text-slate-950" : "text-[12px] font-bold text-slate-800"
    }`;

  return <td className={`${baseClassName} ${className}`}>{showDecimal ? percentFormat.format(value) : numberFormat.format(value)}</td>;
}

function TelemedicineBadgeCell({
  value,
  footer = false,
  color = "emerald",
  size = "md",
}: {
  value: number;
  footer?: boolean;
  color?: "emerald" | "cyan";
  size?: "sm" | "md";
}) {
  const bgClass = color === "emerald" 
    ? (footer ? "bg-emerald-100 ring-emerald-200 text-emerald-800" : "bg-emerald-50 ring-emerald-200 text-emerald-700 group-hover:bg-emerald-100")
    : (footer ? "bg-cyan-100 ring-cyan-200 text-cyan-800" : "bg-cyan-50 ring-cyan-200 text-cyan-700 group-hover:bg-cyan-100");

  const sizeClass = size === "sm" ? "min-w-[50px] text-[11px] px-2 py-0.5" : "min-w-[60px] text-[13px] px-3 py-1";

  return (
    <td className={`whitespace-nowrap px-3 text-right ${footer ? `py-4 ${color === "emerald" ? "bg-emerald-50/50" : "bg-cyan-50/50"}` : "py-2"}`}>
      <span className={`inline-flex justify-center rounded-full font-black ring-1 ${sizeClass} ${bgClass}`}>
        {numberFormat.format(value)}
      </span>
    </td>
  );
}

function PercentCell({
  value,
  footer = false,
  className = "",
  color = "slate",
}: {
  value: number;
  footer?: boolean;
  className?: string;
  color?: "slate" | "indigo" | "cyan" | "emerald";
}) {
  const bgClass = color === "indigo" ? "bg-indigo-50/50 ring-indigo-100" 
    : color === "cyan" ? "bg-cyan-50/50 ring-cyan-100"
    : color === "emerald" ? "bg-emerald-100 ring-emerald-200"
    : "bg-slate-50 ring-slate-100";

  const textClass = color === "indigo" ? "text-indigo-700"
    : color === "cyan" ? "text-cyan-700"
    : color === "emerald" ? "text-emerald-900"
    : "text-slate-700";

  return (
    <td className={`whitespace-nowrap px-3 text-right ${footer ? `py-4 ${color === "indigo" ? "bg-indigo-50/50" : color === "cyan" ? "bg-cyan-50/50" : color === "emerald" ? "bg-emerald-50/50" : "bg-slate-50"}` : "py-2"} ${className}`}>
      <span
        className={`rounded-full px-2 py-0.5 font-black ring-1 ${bgClass} ${textClass} ${footer ? "text-[13px]" : "text-[11px] group-hover:bg-white"}`}
      >
        {percentFormat.format(value)}%
      </span>
    </td>
  );
}

function DiffCell({
  value,
  footer = false,
  className = "",
}: {
  value: number;
  footer?: boolean;
  className?: string;
}) {
  const colorClass = value > 0 ? "text-emerald-700" : value < 0 ? "text-rose-600" : "text-slate-500";
  const footerColorClass = value > 0 ? "text-emerald-700" : value < 0 ? "text-rose-700" : "text-slate-600";
  const sign = value > 0 ? "+" : "";

  return (
    <td className={`whitespace-nowrap px-3 text-right text-[11px] ${footer ? "py-4 font-black" : "py-2 font-black"} ${className}`}>
      <span className={footer ? footerColorClass : colorClass}>
        {sign}
        {numberFormat.format(value)}
      </span>
    </td>
  );
}
