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
  diff_platform_his: number;
  latest_date: string | null;
}

interface DailyHospitalTotals {
  platform_target: number;
  platform_result: number;
  visit_type_2: number;
  visit_type_3: number;
  visit_type_5: number;
  total: number;
}

const numberFormat = new Intl.NumberFormat("th-TH");
const percentFormat = new Intl.NumberFormat("th-TH", {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

function formatThaiDate(value: string | null) {
  if (!value) return "-";

  return new Date(value).toLocaleDateString("th-TH", {
    timeZone: "Asia/Bangkok",
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

async function getDailyHospitalRows(ampCode: string, sortBy: string = "hospcode", sortOrder: string = "ASC"): Promise<DailyHospitalRow[]> {
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
    "diff_platform_his",
  ];
  const finalSortBy = allowedSortColumns.includes(sortBy) ? sortBy : "hospcode";
  const finalSortOrder = sortOrder.toUpperCase() === "DESC" ? "DESC" : "ASC";

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
      COALESCE(vtd.visit_type_5, 0) - COALESCE(p.result, 0) AS diff_platform_his,
      latest.latest_date,
      ht.hostype_name,
      ht.hostype_level
    FROM hospital h
    LEFT JOIN (
        SELECT hostype_new, hostype_name, MAX(CASE WHEN hostype = 'รพช.' THEN 'รพ.' ELSE hostype END) as hostype_level
        FROM hostype
        GROUP BY hostype_new, hostype_name
    ) ht ON h.hostype_new = ht.hostype_new
    LEFT JOIN (
      SELECT hospcode, op_30 AS target
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
      SELECT
        hoscode,
        COALESCE(SUM(visit_type_2), 0) AS visit_type_2,
        COALESCE(SUM(visit_type_3), 0) AS visit_type_3,
        COALESCE(SUM(visit_type_5), 0) AS visit_type_5
      FROM visit_type_daily
      WHERE visit_date BETWEEN '2026-03-23' AND CURDATE()
      GROUP BY hoscode
    ) vtd ON vtd.hoscode = h.hospcode
    WHERE h.amp_code = ?
      AND h.status = '1'
    ORDER BY ${finalSortBy} ${finalSortOrder}
  `;

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
    diff_platform_his: Number(row.diff_platform_his) || 0,
    latest_date: row.latest_date,
    hostype_name: row.hostype_name || '-',
    hostype_level: row.hostype_level || '-',
  }));
}

export default async function DailyHospitalPage({
  searchParams,
}: {
  searchParams: Promise<{ amp_code?: string; sort_by?: string; sort_order?: string }>;
}) {
  const params = await searchParams;
  const ampCode = params.amp_code ?? "";
  const sortBy = params.sort_by ?? "hospcode";
  const sortOrder = params.sort_order ?? "ASC";

  const rows = ampCode ? await getDailyHospitalRows(ampCode, sortBy, sortOrder) : [];
  const districtName = rows[0]?.amp_name ?? "-";
  const latestDate = rows.find((row) => row.latest_date)?.latest_date ?? null;
  const totals = rows.reduce<DailyHospitalTotals>(
    (sum, row) => ({
      platform_target: sum.platform_target + row.platform_target,
      platform_result: sum.platform_result + row.platform_result,
      visit_type_2: sum.visit_type_2 + row.visit_type_2,
      visit_type_3: sum.visit_type_3 + row.visit_type_3,
      visit_type_5: sum.visit_type_5 + row.visit_type_5,
      total: sum.total + row.total,
    }),
    { platform_target: 0, platform_result: 0, visit_type_2: 0, visit_type_3: 0, visit_type_5: 0, total: 0 }
  );
  const platformTotalPercent = totals.platform_target > 0 ? (totals.platform_result / totals.platform_target) * 100 : 0;
  const totalPercent = totals.total > 0 ? (totals.visit_type_5 / totals.total) * 100 : 0;
  const totalDiffPlatformHis = totals.visit_type_5 - totals.platform_result;
  const reportPeriodLabel = `ผลงานให้บริการแพทย์ทางไกล ข้อมูลระหว่าง 23 มีนาคม 2569 - ${rows.length > 0 ? formatThaiDate(rows[0].latest_date || new Date().toISOString()) : "-"
    }`;

  const getSortUrl = (column: string) => {
    const nextOrder = sortBy === column && sortOrder === "ASC" ? "DESC" : "ASC";
    return `/daily/hospital?amp_code=${ampCode}&sort_by=${column}&sort_order=${nextOrder}`;
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
    <main className="min-h-screen bg-background pb-12">
      <Navbar showFilters={false} />

      <section className="px-3 md:px-6 mt-2 md:mt-3">
        <div className="w-full space-y-3">
          <div className="rounded-2xl border border-emerald-100 bg-white/90 p-3 shadow-lg shadow-emerald-900/5 md:p-4">
            <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
              <div>
                <Link
                  href="/daily"
                  className="inline-flex items-center rounded-full bg-slate-100 px-3 py-1 text-[10px] font-black text-slate-600 hover:bg-slate-200"
                >
                  กลับหน้าสรุปอำเภอ
                </Link>
                <h1 className="mt-2 text-xl font-black tracking-tight text-slate-950 md:text-2xl">
                  {districtName === "-" ? "รายหน่วยบริการ" : `รายหน่วยบริการ อ.${districtName}`}
                </h1>
              </div>

              <div className="flex flex-col gap-2 md:flex-row md:items-center">
                <ExportDailyHospital rows={rows} districtName={districtName} />
                <LastUpdate showLogo={false} type="daily" />
              </div>
            </div>
          </div>

          <div className="overflow-hidden rounded-[1.75rem] border border-slate-100 bg-white shadow-xl shadow-slate-900/5">
            <div className="border-b border-slate-100 bg-white px-5 py-3">
              <p className="text-sm font-bold text-emerald-800 md:text-base">
                {reportPeriodLabel}
              </p>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[1400px] divide-y divide-slate-100">
                <thead className="bg-slate-50">
                  <tr className="border-b border-slate-200 text-center text-[13px] font-black text-slate-600">
                    <th className="px-5 py-3 text-left" rowSpan={2}>
                      <Link href={getSortUrl("hospcode")} scroll={false} className="hover:text-emerald-600">
                        รหัส <SortIcon column="hospcode" />
                      </Link>
                    </th>
                    <th className="px-5 py-3 text-left" rowSpan={2}>
                      <Link href={getSortUrl("hospname")} scroll={false} className="hover:text-emerald-600">
                        หน่วยบริการ <SortIcon column="hospname" />
                      </Link>
                    </th>
                    <th className="border-l-2 border-indigo-300 bg-indigo-50 px-5 py-3 text-indigo-700" colSpan={3}>
                      (1) ผลงานบนแพลตฟอร์ม
                      <div className="text-[10px] font-bold opacity-80 mt-0.5">
                        <a
                          href="https://datastudio.google.com/u/0/reporting/33f2a1d7-2f28-43b1-85ea-6cf3e8d579ac/page/p_q5mrcvqeyd"
                          target="_blank"
                          rel="noopener noreferrer"
                          className="hover:underline"
                        >
                          หมอพร้อม Station + สอน.บัดดี้
                        </a>
                      </div>
                    </th>
                    <th className="border-l-2 border-emerald-300 bg-emerald-50 px-5 py-3 text-emerald-700" colSpan={5}>
                      (2) ผลงานใน HIS (
                      <a
                        href="https://hdc.moph.go.th/plk/public/standard-report-detail/2d85d6ec39840f8051854b028fa13073"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="hover:underline hover:text-emerald-900 font-black"
                      >
                        HDC
                      </a>
                      )
                      <div className="flex justify-center mt-1">
                        <span className="text-[9px] font-black px-2 py-0.5 rounded-full bg-white/60 border border-emerald-200 text-emerald-800 shadow-sm">
                          ร้อยละ : ( TYPEIN 5 / รวม 2,3,5 ) × 100
                        </span>
                      </div>
                    </th>
                    <th className="border-l-2 border-amber-300 bg-amber-50 px-5 py-3 text-amber-700" colSpan={1}>
                      (2) ลบ (1)
                    </th>
                  </tr>
                  <tr className="border-b border-slate-200 text-left text-[13px] font-black uppercase tracking-[0.08em] text-slate-500">
                    <th className="border-l-2 border-indigo-300 bg-indigo-50/70 px-5 py-3 text-right">
                      <Link href={getSortUrl("platform_target")} scroll={false} className="hover:text-indigo-700">
                        เป้าหมาย <SortIcon column="platform_target" />
                      </Link>
                    </th>
                    <th className="bg-indigo-50/70 px-5 py-3 text-right">
                      <Link href={getSortUrl("platform_result")} scroll={false} className="hover:text-indigo-700">
                        ผลงาน <SortIcon column="platform_result" />
                      </Link>
                    </th>
                    <th className="bg-indigo-50/70 px-5 py-3 text-right">
                      <Link href={getSortUrl("platform_percent")} scroll={false} className="hover:text-indigo-700">
                        ร้อยละ <SortIcon column="platform_percent" />
                      </Link>
                    </th>
                    <th className="border-l-2 border-emerald-300 bg-emerald-50/70 px-5 py-3 text-right">
                      <Link href={getSortUrl("visit_type_2")} scroll={false} className="hover:text-emerald-600">
                        มาตามนัด(2) <SortIcon column="visit_type_2" />
                      </Link>
                    </th>
                    <th className="bg-emerald-50/70 px-5 py-3 text-right">
                      <Link href={getSortUrl("visit_type_3")} scroll={false} className="hover:text-emerald-600">
                        รับส่งต่อ(3) <SortIcon column="visit_type_3" />
                      </Link>
                    </th>
                    <th className="bg-emerald-50/70 px-5 py-3 text-right">
                      <Link href={getSortUrl("visit_type_5")} scroll={false} className="hover:text-emerald-600">
                        แพทย์ทางไกล(5) <SortIcon column="visit_type_5" />
                      </Link>
                    </th>
                    <th className="bg-emerald-50/70 px-5 py-3 text-right">
                      <Link href={getSortUrl("total")} scroll={false} className="hover:text-emerald-600">
                        2+3+5 <SortIcon column="total" />
                      </Link>
                    </th>
                    <th className="bg-emerald-50/70 px-5 py-3 text-right">
                      <Link href={getSortUrl("percent")} scroll={false} className="hover:text-emerald-600">
                        ร้อยละ <SortIcon column="percent" />
                      </Link>
                    </th>
                    <th className="border-l-2 border-amber-300 bg-amber-50/70 px-5 py-3 text-right">
                      <Link href={getSortUrl("diff_platform_his")} scroll={false} className="hover:text-amber-700">
                        ผลต่าง <SortIcon column="diff_platform_his" />
                      </Link>
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {rows.map((row) => (
                    <tr key={row.hospcode} className="group hover:bg-slate-50">
                      <td className="whitespace-nowrap px-5 py-4 text-[11px] font-black text-slate-500">
                        {row.hospcode}
                      </td>
                      <td className="min-w-[280px] max-w-[400px] px-5 py-4">
                        <Link
                          href={`/daily/hospital/list-daily?hospcode=${encodeURIComponent(row.hospcode)}`}
                          className={`block whitespace-normal break-words text-[11px] font-black leading-snug underline-offset-4 hover:underline ${getRowColor(row.hostype_name)}`}
                        >
                          {row.hospname}
                        </Link>
                      </td>
                      <NumberCell value={Math.round(row.platform_target)} className="border-l-2 border-indigo-200 bg-indigo-50/20" />
                      <NumberCell value={row.platform_result} strong className="bg-indigo-50/20" />
                      <PercentCell value={row.platform_percent} className="bg-indigo-50/20" />
                      <NumberCell value={row.visit_type_2} className="border-l-2 border-emerald-200 bg-emerald-50/20" />
                      <NumberCell value={row.visit_type_3} />
                      <TelemedicineBadgeCell value={row.visit_type_5} />
                      <NumberCell value={row.total} compact />
                      <PercentCell value={row.percent} />
                      <DiffCell value={row.diff_platform_his} className="border-l-2 border-amber-200 bg-amber-50/25" />
                    </tr>
                  ))}
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
                    <td className="px-5 py-5 text-left font-black bg-slate-50" colSpan={2}>
                      <div className="flex items-center gap-3">
                        <div className="h-8 w-1.5 rounded-full bg-slate-400"></div>
                        <span className="text-base font-black text-slate-700">รวม</span>
                      </div>
                    </td>
                    <NumberCell value={Math.round(totals.platform_target)} footer className="bg-indigo-50/50 text-blue-700 font-black" />
                    <NumberCell value={totals.platform_result} footer className="bg-indigo-50/50 text-blue-700 font-black" />
                    <PercentCell value={platformTotalPercent} footer className="bg-indigo-50/50 text-blue-700 font-black" />
                    <NumberCell value={totals.visit_type_2} footer className="bg-emerald-50/50 text-emerald-700 font-black" />
                    <NumberCell value={totals.visit_type_3} footer className="bg-emerald-50/50 text-emerald-700 font-black" />
                    <TelemedicineBadgeCell value={totals.visit_type_5} footer />
                    <NumberCell value={totals.total} footer compact className="bg-slate-50/50 text-slate-700 font-black" />
                    <PercentCell value={totalPercent} footer className="bg-slate-50/50 text-slate-700 font-black" />
                    <DiffCell value={totalDiffPlatformHis} footer className="bg-amber-50/50 text-amber-700 font-black" />
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
    ? `px-5 py-4 text-right text-[11px] ${compact ? "font-normal text-slate-600" : "font-black"}`
    : `whitespace-nowrap px-5 py-2.5 text-right ${compact ? "text-[11px] font-normal text-slate-500" : strong ? "text-[13px] font-black text-slate-950" : "text-[13px] font-bold text-slate-700"
    }`;

  return <td className={`${baseClassName} ${className}`}>{showDecimal ? percentFormat.format(value) : numberFormat.format(value)}</td>;
}

function TelemedicineBadgeCell({
  value,
  footer = false,
}: {
  value: number;
  footer?: boolean;
}) {
  return (
    <td className={`whitespace-nowrap px-5 text-right ${footer ? "py-4 bg-emerald-50/50" : "py-2.5"}`}>
      <span
        className={
          footer
            ? "inline-flex min-w-20 justify-center rounded-full bg-emerald-100 px-4 py-1.5 text-[15px] font-black text-emerald-800 ring-1 ring-emerald-200"
            : "inline-flex min-w-20 justify-center rounded-full bg-emerald-50 px-4 py-1.5 text-[15px] font-black text-emerald-700 ring-1 ring-emerald-200 group-hover:bg-emerald-100"
        }
      >
        {numberFormat.format(value)}
      </span>
    </td>
  );
}

function PercentCell({
  value,
  footer = false,
  className = "",
}: {
  value: number;
  footer?: boolean;
  className?: string;
}) {
  return (
    <td className={`whitespace-nowrap px-5 text-right text-[11px] ${footer ? "py-4 font-black" : "py-2.5"} ${className}`}>
      <span
        className={
          footer
            ? ""
            : "rounded-full bg-slate-50 px-3 py-1 font-black text-slate-700 ring-1 ring-slate-100 group-hover:bg-white"
        }
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
    <td className={`whitespace-nowrap px-5 text-right text-[11px] ${footer ? "py-4 font-black" : "py-2.5 font-black"} ${className}`}>
      <span className={footer ? "" : colorClass}>
        {sign}{numberFormat.format(value)}
      </span>
    </td>
  );
}
