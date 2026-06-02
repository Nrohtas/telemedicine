import Link from "next/link";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import pool from "@/lib/db";

export const dynamic = "force-dynamic";

interface HospitalInfo {
  hospcode: string;
  hospname: string;
  amp_code: string;
  amp_name: string;
}

interface DailyServiceRow {
  visit_date: string;
  visit_type_2: number;
  visit_type_3: number;
  visit_type_5: number;
  total: number;
  percent: number;
  d_update: string | null;
}

interface DailyServiceTotals {
  visit_type_2: number;
  visit_type_3: number;
  visit_type_5: number;
  total: number;
}

const numberFormat = new Intl.NumberFormat("th-TH");
const percentFormat = new Intl.NumberFormat("th-TH", {
  minimumFractionDigits: 0,
  maximumFractionDigits: 2,
});

function formatThaiDateTime(value: string | null) {
  if (!value) return "-";

  const date = new Date(value);
  const dateStr = date.toLocaleDateString("th-TH", {
    day: "numeric",
    month: "short",
    year: "numeric",
    calendar: 'buddhist'
  } as any);

  const hours = date.getHours().toString().padStart(2, '0');
  const minutes = date.getMinutes().toString().padStart(2, '0');

  return `${dateStr} ${hours}:${minutes} น.`;
}

function formatThaiDate(value: string | null) {
  if (!value) return "-";

  return new Date(value).toLocaleDateString("th-TH", {
    day: "numeric",
    month: "short",
    year: "numeric",
    calendar: 'buddhist'
  } as any);
}

async function getHospitalInfo(hospcode: string): Promise<HospitalInfo | null> {
  const [rows]: any = await pool.query(
    `
      SELECT hospcode, hospname, amp_code, amp_name
      FROM hospital
      WHERE hospcode = ?
      LIMIT 1
    `,
    [hospcode]
  );

  return rows[0] ?? null;
}

async function getDailyServiceRows(hospcode: string, sortBy: string = "visit_date", sortOrder: string = "DESC"): Promise<DailyServiceRow[]> {
  const allowedSortColumns = ["visit_date", "visit_type_2", "visit_type_3", "visit_type_5", "total", "percent", "d_update"];
  const finalSortBy = allowedSortColumns.includes(sortBy) ? sortBy : "visit_date";
  const finalSortOrder = sortOrder.toUpperCase() === "DESC" ? "DESC" : "ASC";

  const [rows]: any = await pool.query(
    `
      SELECT
        visit_date,
        COALESCE(visit_type_2, 0) AS visit_type_2,
        COALESCE(visit_type_3, 0) AS visit_type_3,
        COALESCE(visit_type_5, 0) AS visit_type_5,
        (
          COALESCE(visit_type_2, 0) +
          COALESCE(visit_type_3, 0) +
          COALESCE(visit_type_5, 0)
        ) AS total,
        CASE
          WHEN (
            COALESCE(visit_type_2, 0) +
            COALESCE(visit_type_3, 0) +
            COALESCE(visit_type_5, 0)
          ) > 0
          THEN COALESCE(visit_type_5, 0) /
            (
              COALESCE(visit_type_2, 0) +
              COALESCE(visit_type_3, 0) +
              COALESCE(visit_type_5, 0)
            ) * 100
          ELSE 0
        END AS percent,
        d_update
      FROM visit_type_daily
      WHERE hoscode = ?
      ORDER BY ${finalSortBy} ${finalSortOrder}
    `,
    [hospcode]
  );

  return rows.map((row: any): DailyServiceRow => ({
    visit_date: row.visit_date,
    visit_type_2: Number(row.visit_type_2) || 0,
    visit_type_3: Number(row.visit_type_3) || 0,
    visit_type_5: Number(row.visit_type_5) || 0,
    total: Number(row.total) || 0,
    percent: Number(row.percent) || 0,
    d_update: row.d_update,
  }));
}

export default async function DailyHospitalListPage({
  searchParams,
}: {
  searchParams: Promise<{ hospcode?: string; sort_by?: string; sort_order?: string }>;
}) {
  const params = await searchParams;
  const hospcode = params.hospcode ?? "";
  const sortBy = params.sort_by ?? "visit_date";
  const sortOrder = params.sort_order ?? "DESC";

  const [hospital, rows] = hospcode
    ? await Promise.all([getHospitalInfo(hospcode), getDailyServiceRows(hospcode, sortBy, sortOrder)])
    : [null, [] as DailyServiceRow[]];
  const totals = rows.reduce<DailyServiceTotals>(
    (sum, row) => ({
      visit_type_2: sum.visit_type_2 + row.visit_type_2,
      visit_type_3: sum.visit_type_3 + row.visit_type_3,
      visit_type_5: sum.visit_type_5 + row.visit_type_5,
      total: sum.total + row.total,
    }),
    { visit_type_2: 0, visit_type_3: 0, visit_type_5: 0, total: 0 }
  );
  const totalPercent = totals.total > 0 ? (totals.visit_type_5 / totals.total) * 100 : 0;

  const getSortUrl = (column: string) => {
    const nextOrder = sortBy === column && sortOrder === "ASC" ? "DESC" : "ASC";
    return `/daily/hospital/list-daily?hospcode=${hospcode}&sort_by=${column}&sort_order=${nextOrder}`;
  };

  const SortIcon = ({ column }: { column: string }) => {
    if (sortBy !== column) return <span className="ml-1 opacity-20">↕</span>;
    return <span className="ml-1">{sortOrder === "ASC" ? "↑" : "↓"}</span>;
  };

  return (
    <main className="min-h-screen flex flex-col bg-slate-50">
      <Navbar showFilters={false} />

      <section className="px-3 md:px-6 mt-2 md:mt-3">
        <div className="max-w-[1400px] mx-auto space-y-4">
          
          {/* Header Card */}
          <div className="rounded-3xl border border-indigo-100 bg-white p-6 shadow-xl shadow-indigo-900/5 md:p-8 relative overflow-hidden group">
             <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-50/50 rounded-full -mr-32 -mt-32 blur-3xl opacity-60" />
             
             <div className="relative flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
                <div className="space-y-3">
                  <div className="flex items-center gap-3">
                    <Link
                      href={hospital ? `/daily/hospital?amp_code=${encodeURIComponent(hospital.amp_code)}` : "/daily"}
                      className="group/btn inline-flex items-center gap-2 rounded-full bg-slate-100 px-4 py-2 text-xs font-black text-slate-600 hover:bg-indigo-600 hover:text-white transition-all duration-300"
                    >
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M19 12H5M12 19l-7-7 7-7"/>
                      </svg>
                      ย้อนกลับ
                    </Link>
                    <span className="h-1 w-1 rounded-full bg-slate-300" />
                    <span className="text-[10px] font-black uppercase tracking-[0.2em] text-indigo-500">Daily Activity Log</span>
                  </div>
                  
                  <h1 className="text-3xl font-black tracking-tight text-indigo-950 md:text-4xl leading-tight">
                    {hospital?.hospname ?? "ข้อมูลรายวัน"}
                  </h1>
                  
                  <div className="flex flex-wrap items-center gap-3">
                    <div className="px-3 py-1 rounded-lg bg-indigo-50 border border-indigo-100 text-[11px] font-black text-indigo-700">
                      CODE: {hospital?.hospcode || hospcode}
                    </div>
                    <div className="px-3 py-1 rounded-lg bg-emerald-50 border border-emerald-100 text-[11px] font-black text-emerald-700">
                      อ.{hospital?.amp_name || "-"}
                    </div>
                    <div className="px-3 py-1 rounded-lg bg-slate-100 border border-slate-200 text-[11px] font-black text-slate-600">
                      ข้อมูลย้อนหลัง {rows.length} วัน
                    </div>
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row gap-4">
                   <StatItem label="รวมบริการ (2+3+5)" value={totals.total} color="slate" />
                   <StatItem label="แพทย์ทางไกล (5)" value={totals.visit_type_5} color="indigo" />
                   <StatItem label="สัดส่วนเฉลี่ย" value={`${percentFormat.format(totalPercent)}%`} color="emerald" isPercent />
                </div>
             </div>
          </div>

          {/* Table Section */}
          <div className="overflow-hidden rounded-[2rem] border border-slate-100 bg-white shadow-2xl shadow-slate-900/5">
            <div className="overflow-x-auto">
              <table className="w-full min-w-[1000px] divide-y divide-slate-100">
                <thead className="bg-slate-50/80 backdrop-blur-sm sticky top-0 z-20">
                  <tr className="text-center text-[11px] font-black uppercase tracking-widest text-slate-500 border-b border-slate-200">
                    <th className="px-6 py-5 text-left bg-slate-100/50" rowSpan={2}>
                      <Link href={getSortUrl("visit_date")} className="hover:text-indigo-600 flex items-center gap-1">
                        วันที่รับบริการ <SortIcon column="visit_date" />
                      </Link>
                    </th>
                    <th className="px-6 py-4 border-l border-slate-200 bg-indigo-50/30 text-indigo-800" colSpan={4}>
                      จำนวนผู้รับบริการ (แยกประเภท)
                    </th>
                    <th className="px-6 py-4 border-l border-slate-200 bg-emerald-50/30 text-emerald-800" rowSpan={2}>
                       <Link href={getSortUrl("percent")} className="hover:text-emerald-600 flex items-center justify-center gap-1">
                        สัดส่วน % <SortIcon column="percent" />
                      </Link>
                    </th>
                    <th className="px-6 py-4 border-l border-slate-200 bg-slate-100/50 text-slate-600" rowSpan={2}>
                      <Link href={getSortUrl("d_update")} className="hover:text-slate-900 flex items-center justify-end gap-1">
                        บันทึกล่าสุด <SortIcon column="d_update" />
                      </Link>
                    </th>
                  </tr>
                  <tr className="text-[10px] font-black uppercase tracking-tighter text-slate-400 bg-white/50">
                    <th className="px-4 py-3 border-l border-slate-100 text-right">
                       <Link href={getSortUrl("visit_type_2")} className="hover:text-indigo-600">มาตามนัด(2) <SortIcon column="visit_type_2" /></Link>
                    </th>
                    <th className="px-4 py-3 text-right">
                       <Link href={getSortUrl("visit_type_3")} className="hover:text-indigo-600">รับส่งต่อ(3) <SortIcon column="visit_type_3" /></Link>
                    </th>
                    <th className="px-4 py-3 text-right text-indigo-700">
                       <Link href={getSortUrl("visit_type_5")} className="hover:text-indigo-900">แพทย์ทางไกล(5) <SortIcon column="visit_type_5" /></Link>
                    </th>
                    <th className="px-4 py-3 text-right bg-indigo-50/20 text-slate-600">
                       <Link href={getSortUrl("total")} className="hover:text-indigo-600">รวม 2+3+5 <SortIcon column="total" /></Link>
                    </th>
                  </tr>
                </thead>
                
                <tbody className="divide-y divide-slate-100">
                  {rows.map((row) => (
                    <tr key={row.visit_date} className="group hover:bg-indigo-50/30 transition-colors duration-200">
                      <td className="whitespace-nowrap px-6 py-4 font-black text-slate-900">
                        <div className="flex flex-col">
                           <span className="text-sm">{formatThaiDate(row.visit_date)}</span>
                           <span className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">{new Date(row.visit_date).toLocaleDateString('en-US', { weekday: 'short' })}</span>
                        </div>
                      </td>
                      <NumberCell value={row.visit_type_2} />
                      <NumberCell value={row.visit_type_3} />
                      <td className="whitespace-nowrap px-4 py-4 text-right">
                         <span className="inline-flex justify-center rounded-full font-black ring-1 min-w-[60px] text-[13px] px-3 py-1 bg-indigo-50 ring-indigo-200 text-indigo-700 group-hover:bg-indigo-100 group-hover:ring-indigo-300 transition-all">
                            {numberFormat.format(row.visit_type_5)}
                         </span>
                      </td>
                      <NumberCell value={row.total} strong className="bg-indigo-50/10" />
                      <td className="whitespace-nowrap px-6 py-4 text-center">
                        <span className={`rounded-full px-3 py-1 font-black ring-1 text-[12px] ${row.percent > 0 ? 'bg-emerald-50 ring-emerald-200 text-emerald-700' : 'bg-slate-50 ring-slate-100 text-slate-400'}`}>
                          {percentFormat.format(row.percent)}%
                        </span>
                      </td>
                      <td className="whitespace-nowrap px-6 py-4 text-right text-[11px] font-bold text-slate-400 tabular-nums">
                        {formatThaiDateTime(row.d_update)}
                      </td>
                    </tr>
                  ))}
                  {rows.length === 0 && (
                    <tr>
                      <td colSpan={7} className="px-6 py-20 text-center">
                        <div className="flex flex-col items-center gap-3">
                          <div className="w-16 h-16 rounded-full bg-slate-50 flex items-center justify-center text-slate-300">
                            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
                          </div>
                          <p className="font-black text-slate-400 uppercase tracking-widest text-sm">ไม่พบข้อมูลรับบริการ</p>
                        </div>
                      </td>
                    </tr>
                  )}
                </tbody>

                {rows.length > 0 && (
                  <tfoot className="sticky bottom-0 z-10 bg-white border-t-2 border-slate-200 shadow-[0_-10px_20px_rgba(0,0,0,0.05)] font-black">
                    <tr>
                      <td className="px-6 py-5 text-left text-[13px] uppercase tracking-widest bg-slate-50 text-slate-600">ยอดรวมทั้งหมด</td>
                      <td className="px-4 py-5 text-right bg-indigo-50/20 text-indigo-600 text-[13px]">{numberFormat.format(totals.visit_type_2)}</td>
                      <td className="px-4 py-5 text-right bg-indigo-50/20 text-indigo-600 text-[13px]">{numberFormat.format(totals.visit_type_3)}</td>
                      <td className="px-4 py-5 text-right bg-indigo-50/50 text-indigo-900 text-[15px] underline decoration-indigo-400/30 underline-offset-8 decoration-4">{numberFormat.format(totals.visit_type_5)}</td>
                      <td className="px-4 py-5 text-right bg-slate-50/50 text-slate-900 text-[13px]">{numberFormat.format(totals.total)}</td>
                      <td className="px-6 py-5 text-center bg-emerald-50/50 text-emerald-700 text-base">{percentFormat.format(totalPercent)}%</td>
                      <td className="px-6 py-5 bg-slate-50/50" />
                    </tr>
                  </tfoot>
                )}
              </table>
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </main>
  );
}

function StatItem({ label, value, color, isPercent = false }: { label: string; value: string | number; color: string; isPercent?: boolean }) {
  const colors: Record<string, string> = {
    indigo: "text-indigo-900 bg-indigo-50 border-indigo-100",
    emerald: "text-emerald-900 bg-emerald-50 border-emerald-100",
    slate: "text-slate-900 bg-slate-50 border-slate-100",
  };
  
  const labelColors: Record<string, string> = {
    indigo: "text-indigo-500",
    emerald: "text-emerald-600",
    slate: "text-slate-500",
  };

  return (
    <div className={`flex flex-col items-end px-6 py-4 rounded-3xl border shadow-sm min-w-[160px] ${colors[color]}`}>
      <span className={`text-[10px] font-black uppercase tracking-widest mb-1 ${labelColors[color]}`}>{label}</span>
      <span className={`text-2xl font-black tabular-nums ${isPercent ? "text-3xl" : ""}`}>{value}</span>
    </div>
  );
}

function NumberCell({
  value,
  strong = false,
  className = "",
}: {
  value: number;
  strong?: boolean;
  className?: string;
}) {
  return (
    <td className={`whitespace-nowrap px-4 py-4 text-right text-[13px] ${strong ? "font-black text-slate-950" : "font-bold text-slate-600"} ${className}`}>
      {numberFormat.format(value)}
    </td>
  );
}
