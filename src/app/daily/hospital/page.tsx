import Link from "next/link";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import pool from "@/lib/db";
import ExportDailyHospital from "./ExportDailyHospital";
import LastUpdate from "@/components/LastUpdate";

export const dynamic = "force-dynamic";

interface DailyHospitalRow {
  hospcode: string;
  hospname: string;
  amp_code: string;
  amp_name: string;
  hostype_name: string;
  hostype_level: string;
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

interface DailyHospitalTotals {
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
  minimumFractionDigits: 0,
  maximumFractionDigits: 2,
});

function formatThaiDate(value: string | null) {
  if (!value) return "-";

  return new Date(value).toLocaleDateString("th-TH", {
    timeZone: "Asia/Bangkok",
    day: "numeric",
    month: "long",
    year: "numeric",
    calendar: 'buddhist'
  } as any);
}

async function getDailyHospitalRows(ampCode: string, sortBy: string = "hospcode", sortOrder: string = "ASC", policy: string = "normal", view: string = "hospital"): Promise<DailyHospitalRow[]> {
  const allowedSortColumns = [
    "hospcode",
    "hospname",
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
    "diff_hdc_platform",
  ];
  const finalSortBy = allowedSortColumns.includes(sortBy) ? sortBy : "hospcode";
  const finalSortOrder = sortOrder.toUpperCase() === "DESC" ? "DESC" : "ASC";

  const hdcTable = policy === "pheoc" ? "telemed_opd_hdc_pheoc" : "telemed_opd_hdc";
  const hisStartDate = policy === "pheoc" ? "2026-03-23" : "2026-01-01";
  const hostypeFilter = view === "primary" ? "AND h.hostype_new IN (18, 21, 8, 13)" : "";

  const query = `
    SELECT
      h.hospcode,
      h.hospname,
      h.amp_code,
      h.amp_name,
      COALESCE(tgt.target, 0) AS platform_target,
      COALESCE(p.result, 0) AS platform_result,
      CASE
        WHEN COALESCE(tgt.target, 0) > 0
        THEN COALESCE(p.result, 0) / COALESCE(tgt.target, 0) * 100
        ELSE 0
      END AS platform_percent,
      COALESCE(vtd.visit_type_2, 0) AS visit_type_2,
      COALESCE(vtd.visit_type_3, 0) AS visit_type_3,
      COALESCE(vtd.visit_type_5, 0) AS visit_type_5,
      (
        COALESCE(vtd.visit_type_2, 0) +
        COALESCE(vtd.visit_type_3, 0) +
        COALESCE(vtd.visit_type_5, 0)
      ) AS total,
      CASE
        WHEN (
          COALESCE(vtd.visit_type_2, 0) +
          COALESCE(vtd.visit_type_3, 0) +
          COALESCE(vtd.visit_type_5, 0)
        ) > 0
        THEN COALESCE(vtd.visit_type_5, 0) /
          (
            COALESCE(vtd.visit_type_2, 0) +
            COALESCE(vtd.visit_type_3, 0) +
            COALESCE(vtd.visit_type_5, 0)
          ) * 100
        ELSE 0
      END AS percent,
      COALESCE(hdc.opd, 0) AS hdc_opd,
      COALESCE(hdc.telemedicine, 0) AS hdc_result,
      CASE
        WHEN COALESCE(hdc.opd, 0) > 0
        THEN COALESCE(hdc.telemedicine, 0) / COALESCE(hdc.opd, 0) * 100
        ELSE 0
      END AS hdc_percent,
      COALESCE(vtd.visit_type_5, 0) - COALESCE(p.result, 0) AS diff_platform_his,
      COALESCE(hdc.telemedicine, 0) - COALESCE(vtd.visit_type_5, 0) AS diff_hdc_his,
      latest.latest_date,
      latest_t.latest_time,
      ht.hostype_name,
      ht.hostype_level
    FROM hospital h
    LEFT JOIN (
        SELECT hostype_new, hostype_name, MAX(CASE WHEN hostype = 'รพช.' THEN 'รพ.' ELSE hostype END) as hostype_level
        FROM hostype
        GROUP BY hostype_new, hostype_name
    ) ht ON h.hostype_new = ht.hostype_new COLLATE utf8mb4_general_ci
    LEFT JOIN (
      SELECT hospcode, CEILING(COALESCE(op, 0)) AS target
      FROM target
      WHERE b_year = '2568'
    ) tgt ON tgt.hospcode = h.hospcode COLLATE utf8mb4_general_ci
    LEFT JOIN (
      SELECT hospcode, result
      FROM telemed
      WHERE b_year = '2569'
    ) p ON p.hospcode = h.hospcode COLLATE utf8mb4_general_ci
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
      WHERE visit_date BETWEEN '${hisStartDate}' AND CURDATE()
      GROUP BY hoscode
    ) vtd ON vtd.hoscode = h.hospcode COLLATE utf8mb4_general_ci
    LEFT JOIN ${hdcTable} hdc
      ON hdc.hospcode = h.hospcode COLLATE utf8mb4_general_ci
      AND hdc.b_year = '2569'
    WHERE h.amp_code = ? COLLATE utf8mb4_general_ci
      AND h.status = '1'
      ${hostypeFilter}
    ORDER BY ${finalSortBy} ${finalSortOrder}
  `;

  try {
    const [rows]: any = await pool.query(query, [ampCode]);

    return rows.map((row: any): DailyHospitalRow => ({
      hospcode: row.hospcode,
      hospname: row.hospname,
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
      hostype_name: row.hostype_name || '-',
      hostype_level: row.hostype_level || '-',
    }));
  } catch (error) {
    console.error('Error in getDailyHospitalRows:', error);
    return [];
  }
}

async function getPlatformLatestUpdate(): Promise<string | null> {
  try {
    const [rows]: any = await pool.query("SELECT DATE_FORMAT(MAX(file_time), '%Y-%m-%d %H:%i:%s') as last_update FROM fileupload WHERE file_platform = 'moph_buddycare'");
    return rows[0]?.last_update || null;
  } catch (err) {
    console.error('Error fetching Platform latest update:', err);
    return null;
  }
}

async function getHdcLatestUpdate(policy: string = "normal"): Promise<string | null> {
  const hdcTable = policy === "pheoc" ? "telemed_opd_hdc_pheoc" : "telemed_opd_hdc";
  try {
    const [rows]: any = await pool.query(`SELECT DATE_FORMAT(MAX(hdc_update), '%Y-%m-%d') as last_update FROM ${hdcTable}`);
    return rows[0]?.last_update || null;
  } catch (err) {
    console.error('Error fetching HDC latest update:', err);
    return null;
  }
}

export default async function DailyHospitalPage({
  searchParams,
}: {
  searchParams: Promise<{ amp_code?: string; sort_by?: string; sort_order?: string; policy?: string; view?: string }>;
}) {
  try {
    const params = await searchParams;
    const ampCode = params.amp_code ?? "";
    const sortBy = params.sort_by ?? "hospcode";
    const sortOrder = params.sort_order ?? "ASC";
    const policy = params.policy === "pheoc" ? "pheoc" : "normal";
    const view = params.view === "primary" ? "primary" : "hospital";

    const rows = ampCode ? await getDailyHospitalRows(ampCode, sortBy, sortOrder, policy, view) : [];
    const hdcLastUpdate = await getHdcLatestUpdate(policy);
    const platformLastUpdate = await getPlatformLatestUpdate();
    const hisLastUpdate = rows[0]?.latest_date || null;
    const districtName = rows[0]?.amp_name ?? "-";
    const totals = rows.reduce<DailyHospitalTotals>(
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

    const startDateThai = policy === "pheoc" ? "23 มีนาคม 2569" : "1 มกราคม 2569";
    const reportPeriodLabel = `ผลงานให้บริการแพทย์ทางไกล ข้อมูลระหว่าง ${startDateThai} - ${rows.length > 0 ? formatThaiDate(rows[0].latest_date || new Date().toISOString()) : "-"}`;

    const getSortUrl = (column: string) => {
      const nextOrder = sortBy === column && sortOrder === "ASC" ? "DESC" : "ASC";
      return `/daily/hospital?amp_code=${ampCode}&sort_by=${column}&sort_order=${nextOrder}${policy !== "normal" ? `&policy=${policy}` : ""}${view !== "hospital" ? `&view=${view}` : ""}`;
    };

    const SortIcon = ({ column }: { column: string }) => {
      if (sortBy !== column) return <span className="ml-1 opacity-20">↕</span>;
      return <span className="ml-1">{sortOrder === "ASC" ? "↑" : "↓"}</span>;
    };

    const getRowColor = (hostypeName: string) => {
      if (hostypeName === 'กระทรวงสาธารณสุข') return 'text-green-600';
      if (hostypeName === 'องค์กรปกครองส่วนท้องถิ่น') return 'text-purple-600';
      return 'text-slate-900';
    };

    const getHostColor = (label: string) => {
      const text = label || '';
      if (text.includes('รพ.สต.')) return 'text-blue-600 bg-blue-50 ring-blue-100';
      if (text.includes('รพศ.')) return 'text-pink-500 bg-pink-50 ring-pink-100';
      if (text === 'รพ.' || text === 'รพช.' || text.includes('รพช.')) return 'text-orange-500 bg-orange-50 ring-orange-100';
      if (text.includes('ศูนย์สุขภาพ')) return 'text-indigo-900 bg-indigo-50 ring-indigo-100';
      if (text.includes('นอกสังกัด')) return 'text-black bg-slate-50 ring-slate-100';
      return 'text-slate-500 bg-slate-50 ring-slate-100';
    };

    return (
      <main className="min-h-screen flex flex-col bg-background">
        <Navbar showFilters={false} />

        <section className="px-3 md:px-6 mt-2 md:mt-3">
          <div className="w-full space-y-3">
            <div className="rounded-2xl border border-emerald-100 bg-white/90 p-3 shadow-lg shadow-emerald-900/5 md:p-4">
              <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                <div className="flex flex-col sm:flex-row sm:items-center gap-4">
                  <div>
                    <Link
                      href={`/daily?view=${view}${policy !== "normal" ? `&policy=${policy}` : ""}`}
                      className="inline-flex items-center rounded-full bg-slate-100 px-3 py-1 text-[10px] font-black text-slate-600 hover:bg-slate-200"
                    >
                      กลับหน้าสรุปอำเภอ
                    </Link>
                    <h1 className="mt-2 text-xl font-black tracking-tight text-slate-950 md:text-2xl">
                      {districtName === "-" 
                        ? (view === "primary" ? "รายหน่วยบริการปฐมภูมิ" : "รายหน่วยบริการ") 
                        : (view === "primary" ? `รายหน่วยบริการปฐมภูมิ อ.${districtName}` : `รายหน่วยบริการ อ.${districtName}`)}
                    </h1>
                  </div>

                  {/* Premium Switcher Pills on Hospital Page */}
                  <div className="flex items-center bg-slate-100 p-1 rounded-xl border border-slate-200 shadow-inner mt-1 sm:mt-4">
                    <Link
                      href={`/daily/hospital?amp_code=${ampCode}&policy=normal${sortBy !== "hospcode" ? `&sort_by=${sortBy}` : ""}${sortOrder !== "ASC" ? `&sort_order=${sortOrder}` : ""}${view !== "hospital" ? `&view=${view}` : ""}`}
                      className={`px-3 py-1.5 rounded-lg text-[10px] font-black transition-all ${policy === "normal"
                          ? "bg-white text-emerald-700 shadow-sm border border-slate-200/50"
                          : "text-slate-500 hover:text-slate-800"
                        }`}
                    >
                      นโยบาย TMM (1 ม.ค. 2569)
                    </Link>
                    <Link
                      href={`/daily/hospital?amp_code=${ampCode}&policy=pheoc${sortBy !== "hospcode" ? `&sort_by=${sortBy}` : ""}${sortOrder !== "ASC" ? `&sort_order=${sortOrder}` : ""}${view !== "hospital" ? `&view=${view}` : ""}`}
                      className={`px-3 py-1.5 rounded-lg text-[10px] font-black transition-all ${policy === "pheoc"
                          ? "bg-white text-orange-600 shadow-sm border border-slate-200/50"
                          : "text-slate-500 hover:text-slate-800"
                        }`}
                    >
                      นโยบาย PHEOC (23 มี.ค. 2569)
                    </Link>
                  </div>
                </div>

                <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
                  <Link
                    href={`/daily/onepage${policy !== "normal" ? `?policy=${policy}` : ""}`}
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
                  <ExportDailyHospital rows={rows} districtName={districtName} policy={policy} view={view} />
                </div>
              </div>
            </div>

            <div className="overflow-hidden rounded-[1.75rem] border border-slate-100 bg-white shadow-xl shadow-slate-900/5">
              <div className="border-b border-slate-100 bg-white px-5 py-3">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                  <p className={`text-sm font-bold md:text-base ${policy === "pheoc" ? "text-orange-700" : "text-emerald-800"}`} suppressHydrationWarning>
                    {reportPeriodLabel}
                  </p>
                  <div className="flex items-center gap-4 ml-auto">
                    <div className="flex items-center gap-2 bg-blue-50 px-3 py-1.5 rounded-full border border-blue-100 shadow-sm">
                      <span className="text-[10px] font-black text-blue-800 uppercase tracking-widest whitespace-nowrap">HIS UPDATE :</span>
                      <span className="text-[11px] font-black text-blue-600 whitespace-nowrap uppercase" suppressHydrationWarning>
                        {hisLastUpdate ? new Date(hisLastUpdate).toLocaleDateString('th-TH', {
                          timeZone: 'Asia/Bangkok',
                          day: 'numeric',
                          month: 'short',
                          year: 'numeric',
                          calendar: 'buddhist'
                        } as any) + ' ' + new Date(hisLastUpdate).toLocaleTimeString('th-TH', {
                          timeZone: 'Asia/Bangkok',
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
                        <span className="text-[10px] font-black text-emerald-500 uppercase tracking-tighter whitespace-nowrap" suppressHydrationWarning>
                          {new Date(hdcLastUpdate).toLocaleDateString('th-TH', {
                            timeZone: 'Asia/Bangkok',
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
              <div className="overflow-auto max-h-[70vh] border border-slate-100 rounded-2xl">
                <table className="w-full min-w-[1500px] divide-y divide-slate-100">
                  <thead className="bg-slate-50">
                    <tr className="border-b border-slate-200 text-center text-[13px] font-black text-slate-600">
                      <th className="px-5 py-3 text-left sticky left-0 top-0 bg-slate-50 z-30 shadow-[2px_0_5px_-2px_rgba(0,0,0,0.1)]" rowSpan={2}>
                        <Link href={getSortUrl("hospcode")} scroll={false} className="hover:text-emerald-600">
                          รหัส <SortIcon column="hospcode" />
                        </Link>
                      </th>
                      <th className="px-5 py-3 text-left sticky top-0 bg-slate-50 z-20" rowSpan={2}>
                        <Link href={getSortUrl("hospname")} scroll={false} className="hover:text-emerald-600">
                          หน่วยบริการ <SortIcon column="hospname" />
                        </Link>
                      </th>
                      <th className="border-l-2 border-indigo-300 bg-indigo-50 px-3 py-3 text-indigo-700 sticky top-0 z-20" colSpan={3}>
                        <div className="flex flex-col items-center gap-1">
                          <span className="text-[13px] font-black uppercase">ผลงาน PLATFORM</span>
                          <div className="text-[9px] font-bold opacity-80 scale-90 origin-center">
                            <a
                              href="https://datastudio.google.com/u/0/reporting/33f2a1d7-2f28-43b1-85ea-6cf3e8d579ac/page/p_q5mrcvqeyd"
                              target="_blank"
                              rel="noopener noreferrer"
                              className="hover:underline flex items-center gap-1"
                            >
                              <div className="p-0.5 rounded-md bg-emerald-50 shadow-sm ring-1 ring-emerald-100/50">
                                <svg width="10" height="10" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                  <circle cx="50" cy="22" r="14" fill="#006837" />
                                  <path d="M25 40H75V75C75 80 71 84 66 84H34C29 84 25 80 25 75V40Z" stroke="#F6D76E" strokeWidth="10" />
                                  <rect x="40" y="52" width="20" height="7" fill="#A5A7AA" />
                                  <rect x="46.5" y="46" width="7" height="19" fill="#A5A7AA" />
                                </svg>
                              </div>
                              <span>หมอพร้อม Station + สอน.บัดดี้</span>
                            </a>
                          </div>
                        </div>
                      </th>
                      <th className="border-l-2 border-cyan-300 bg-cyan-50 px-3 py-3 text-cyan-900 sticky top-0 z-20" colSpan={5}>
                        ผลงาน HIS
                        <div className="flex justify-center mt-1">
                          <span className="text-[9px] font-black px-2 py-0.5 rounded-full bg-white/60 border border-cyan-200 text-cyan-900 shadow-sm">
                            (SERVICE TYPEIN 5 / TYPEIN 2+3+5) x 100
                          </span>
                        </div>
                      </th>
                      <th className="border-l-2 border-emerald-300 bg-emerald-50 px-3 py-3 text-emerald-900 sticky top-0 z-20" colSpan={3}>
                        ผลงาน HDC
                        <div className="flex justify-center mt-1">
                          <span className="text-[9px] font-black px-2 py-0.5 rounded-full bg-white/60 border border-emerald-200 text-emerald-900 shadow-sm">
                            ( Tele (5) / OPD (2,3,5) ) × 100
                          </span>
                        </div>
                      </th>
                      <th className="border-l-2 border-amber-300 bg-amber-50 px-3 py-3 text-amber-700 sticky top-0 z-20" colSpan={2}>
                        ผลต่าง
                      </th>
                    </tr>
                    <tr className="border-b border-slate-200 text-left text-[11px] font-black uppercase tracking-tight text-slate-500">
                      <th className="border-l-2 border-indigo-300 bg-indigo-50/70 px-3 py-2 text-right sticky top-[47px] z-20">
                        <Link href={getSortUrl("platform_target")} scroll={false} className="hover:text-indigo-700 text-indigo-700">
                          เป้าหมาย <SortIcon column="platform_target" />
                        </Link>
                      </th>
                      <th className="bg-indigo-50/70 px-3 py-2 text-right sticky top-[47px] z-20">
                        <Link href={getSortUrl("platform_result")} scroll={false} className="hover:text-indigo-700 text-indigo-700">
                          ผลงาน <SortIcon column="platform_result" />
                        </Link>
                      </th>
                      <th className="bg-indigo-50/70 px-3 py-2 text-center sticky top-[47px] z-20">
                        <Link href={getSortUrl("platform_percent")} scroll={false} className="hover:text-indigo-700 font-black text-[14px] text-indigo-700">
                          % <SortIcon column="platform_percent" />
                        </Link>
                      </th>
                      <th className="border-l-2 border-cyan-300 bg-cyan-50/70 px-3 py-2 text-right whitespace-nowrap text-cyan-900 sticky top-[47px] z-20">
                        <Link href={getSortUrl("visit_type_2")} scroll={false} className="hover:text-cyan-900">
                          มาตามนัด(2) <SortIcon column="visit_type_2" />
                        </Link>
                      </th>
                      <th className="bg-cyan-50/70 px-3 py-2 text-right whitespace-nowrap text-cyan-900 sticky top-[47px] z-20">
                        <Link href={getSortUrl("visit_type_3")} scroll={false} className="hover:text-cyan-900">
                          รับส่งต่อ(3) <SortIcon column="visit_type_3" />
                        </Link>
                      </th>
                      <th className="bg-cyan-50/70 px-3 py-2 text-right whitespace-nowrap text-cyan-900 sticky top-[47px] z-20">
                        <Link href={getSortUrl("visit_type_5")} scroll={false} className="hover:text-cyan-900">
                          Tele(5) <SortIcon column="visit_type_5" />
                        </Link>
                      </th>
                      <th className="bg-cyan-50/70 px-3 py-2 text-right whitespace-nowrap text-cyan-900 sticky top-[47px] z-20">
                        <Link href={getSortUrl("total")} scroll={false} className="hover:text-cyan-900">
                          รวม 2,3,5 <SortIcon column="total" />
                        </Link>
                      </th>
                      <th className="bg-cyan-50/70 px-3 py-2 text-center sticky top-[47px] z-20">
                        <Link href={getSortUrl("percent")} scroll={false} className="hover:text-cyan-600 font-black text-[14px]">
                          % <SortIcon column="percent" />
                        </Link>
                      </th>
                      <th className="border-l-2 border-emerald-300 bg-emerald-50/70 px-3 py-2 text-right text-emerald-950 sticky top-[47px] z-20">
                        <Link href={getSortUrl("hdc_opd")} scroll={false} className="hover:text-emerald-950">
                          OPD (2,3,5) <SortIcon column="hdc_opd" />
                        </Link>
                      </th>
                      <th className="bg-emerald-50/70 px-3 py-2 text-right text-emerald-950 sticky top-[47px] z-20">
                        <Link href={getSortUrl("hdc_result")} scroll={false} className="hover:text-emerald-950">
                          Tele (5) <SortIcon column="hdc_result" />
                        </Link>
                      </th>
                      <th className="bg-emerald-50/70 px-3 py-2 text-center text-emerald-950 sticky top-[47px] z-20">
                        <Link href={getSortUrl("hdc_percent")} scroll={false} className="hover:text-emerald-950 font-black text-[14px]">
                          % <SortIcon column="hdc_percent" />
                        </Link>
                      </th>
                      <th className="border-l-2 border-amber-300 bg-amber-50/70 px-3 py-2 text-right text-amber-900 sticky top-[47px] z-20">
                        <Link href={getSortUrl("diff_hdc_platform")} scroll={false} className="hover:text-amber-900">
                          HDC - PLATFORM <SortIcon column="diff_hdc_platform" />
                        </Link>
                      </th>
                      <th className="bg-amber-50/70 px-3 py-2 text-right text-amber-900 sticky top-[47px] z-20">
                        <Link href={getSortUrl("diff_hdc_his")} scroll={false} className="hover:text-amber-900">
                          HDC - HIS <SortIcon column="diff_hdc_his" />
                        </Link>
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {rows.map((row) => {
                      const diff_hdc_platform = row.hdc_result - row.platform_result;
                      const diff_hdc_his = row.hdc_result - row.visit_type_5;
                      return (
                        <tr key={row.hospcode} className="group hover:bg-slate-50">
                          <td className="whitespace-nowrap px-5 py-4 text-[11px] font-black text-slate-500 sticky left-0 bg-white group-hover:bg-slate-50 z-10 shadow-[2px_0_5px_-2px_rgba(0,0,0,0.1)]">
                            {row.hospcode}
                          </td>
                          <td className="min-w-[280px] max-w-[400px] px-5 py-4">
                            <Link
                              href={`/daily/hospital/list-daily?hospcode=${encodeURIComponent(row.hospcode)}`}
                              className={`block whitespace-normal break-words text-[11px] font-bold leading-snug underline-offset-4 hover:underline ${getRowColor(row.hostype_name)}`}
                            >
                              {row.hospname}
                            </Link>
                          </td>
                          <NumberCell value={Math.round(row.platform_target)} className="border-l-2 border-indigo-200 bg-indigo-50/20" compact />
                          <NumberCell value={row.platform_result} className="bg-indigo-50/20" compact />
                          <PercentCell value={row.platform_percent} className="bg-indigo-50/20" color="indigo" />
                          <NumberCell value={row.visit_type_2} className="border-l-2 border-cyan-200 bg-cyan-50/10 font-bold text-cyan-800" />
                          <NumberCell value={row.visit_type_3} className="bg-cyan-50/10 font-bold text-cyan-800" />
                          <TelemedicineBadgeCell value={row.visit_type_5} color="cyan" size="sm" />
                          <NumberCell value={row.total} className="bg-cyan-50/10 font-bold text-cyan-900" />
                          <PercentCell value={row.percent} className="bg-cyan-50/10" color="cyan" />
                          <NumberCell value={row.hdc_opd} className="border-l-2 border-emerald-200 bg-emerald-50/30" />
                          <TelemedicineBadgeCell value={row.hdc_result} color="emerald" />
                          <PercentCell value={row.hdc_percent} className="bg-emerald-50/30 font-black text-emerald-900" color="emerald" />
                          <DiffCell value={diff_hdc_platform} className="border-l-2 border-amber-200 bg-amber-50/25" />
                          <DiffCell value={diff_hdc_his} className="bg-amber-50/25" />
                        </tr>
                      );
                    })}
                    {rows.length === 0 && (
                      <tr>
                        <td colSpan={12} className="px-5 py-12 text-center font-bold text-slate-400">
                          ไม่พบข้อมูลโรงพยาบาลในอำเภอนี้
                        </td>
                      </tr>
                    )}
                  </tbody>
                  <tfoot className="sticky bottom-0 z-10 bg-white border-t-2 border-slate-200 shadow-[0_-10px_20px_rgba(0,0,0,0.05)]">
                    <tr className="text-center">
                      <td className="px-5 py-5 text-left font-black bg-slate-50 sticky left-0 z-10 shadow-[2px_0_5px_-2px_rgba(0,0,0,0.1)]" colSpan={2}>
                        <div className="flex items-center gap-3">
                          <div className="h-8 w-1.5 rounded-full bg-slate-400"></div>
                          <span className="text-base font-black text-slate-700">รวม</span>
                        </div>
                      </td>
                      <NumberCell value={Math.round(totals.platform_target)} footer compact className="bg-indigo-50/50 text-indigo-700 font-normal" />
                      <NumberCell value={totals.platform_result} footer compact className="bg-indigo-50/50 text-indigo-700 font-normal" />
                      <PercentCell value={platformTotalPercent} footer className="bg-indigo-50/50 text-blue-700 font-normal" color="indigo" />
                      <NumberCell value={totals.visit_type_2} footer className="bg-cyan-50/50 text-cyan-800 font-bold" />
                      <NumberCell value={totals.visit_type_3} footer className="bg-cyan-50/50 text-cyan-800 font-bold" />
                      <TelemedicineBadgeCell value={totals.visit_type_5} footer color="cyan" size="sm" />
                      <NumberCell value={totals.total} footer className="bg-cyan-50/50 text-cyan-900 font-bold" />
                      <PercentCell value={totalPercent} footer className="bg-cyan-50/50 text-cyan-800 font-bold" color="cyan" />
                      <NumberCell value={totals.hdc_opd} footer className="bg-emerald-50/50 text-emerald-800 font-bold" />
                      <TelemedicineBadgeCell value={totals.hdc_result} footer color="emerald" />
                      <PercentCell value={hdcTotalPercent} footer className="bg-emerald-50/50 text-emerald-800 font-bold" color="emerald" />
                      <DiffCell value={totals.hdc_result - totals.platform_result} footer className="bg-amber-50/50 text-amber-700 font-bold" />
                      <DiffCell value={totals.hdc_result - totals.visit_type_5} footer className="bg-amber-50/50 text-amber-700 font-bold" />
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
  } catch (error) {
    console.error('Error in DailyHospitalPage:', error);
    throw error;
  }
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
    ? `px-3 py-4 text-right text-[11px] ${compact ? "font-normal text-slate-600" : "font-black"}`
    : `whitespace-nowrap px-3 py-2 text-right ${compact ? "text-[11px] font-medium text-slate-600" : strong ? "text-[13px] font-black text-slate-950" : "text-[12px] font-bold text-slate-700"
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
      <span className={footer ? "" : colorClass}>
        {sign}{numberFormat.format(value)}
      </span>
    </td>
  );
}
