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

  const timeStr = date.toLocaleTimeString("th-TH", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false
  });

  return `${dateStr} ${timeStr} น.`;
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
    <main className="min-h-screen bg-background pb-12">
      <Navbar showFilters={false} />

      <section className="px-4 md:px-6 mt-4 md:mt-8">
        <div className="mx-auto max-w-7xl space-y-6">
          <div className="rounded-[2rem] border border-amber-100 bg-white/90 p-6 shadow-2xl shadow-amber-900/5 md:p-8">
            <div className="flex flex-col gap-5 md:flex-row md:items-end md:justify-between">
              <div>
                <Link
                  href={hospital ? `/daily/hospital?amp_code=${encodeURIComponent(hospital.amp_code)}` : "/daily"}
                  className="inline-flex items-center rounded-full bg-slate-100 px-4 py-2 text-xs font-black text-slate-600 hover:bg-slate-200"
                >
                  กลับหน้ารายโรงพยาบาล
                </Link>
                <p className="mt-5 text-xs font-black uppercase tracking-[0.35em] text-amber-600">
                  Daily Service List
                </p>
                <h1 className="mt-2 text-3xl font-black tracking-tight text-slate-950 md:text-5xl">
                  {hospital?.hospname ?? "ข้อมูลรายวันของหน่วยบริการ"}
                </h1>
                <p className="mt-2 text-sm font-bold text-slate-500">
                  {hospital ? `${hospital.hospcode} | อ.${hospital.amp_name}` : hospcode || "-"}
                </p>
              </div>

              <div className="rounded-2xl border border-amber-100 bg-amber-50/80 px-5 py-4 text-right">
                <p className="text-[10px] font-black uppercase tracking-[0.25em] text-amber-600">
                  จำนวนวันที่มีข้อมูล
                </p>
                <p className="mt-1 text-xl font-black text-amber-900">
                  {numberFormat.format(rows.length)} วัน
                </p>
              </div>
            </div>
          </div>

          <div className="overflow-hidden rounded-[1.75rem] border border-slate-100 bg-white shadow-xl shadow-slate-900/5">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-slate-100">
                <thead className="bg-slate-50">
                  <tr className="text-left text-[11px] font-black uppercase tracking-[0.18em] text-slate-500">
                    <th className="px-5 py-4">
                      <Link href={getSortUrl("visit_date")} className="hover:text-amber-600">
                        วันที่ <SortIcon column="visit_date" />
                      </Link>
                    </th>
                    <th className="px-5 py-4 text-right">
                      <Link href={getSortUrl("visit_type_2")} className="hover:text-amber-600">
                        มาตามนัด(2) <SortIcon column="visit_type_2" />
                      </Link>
                    </th>
                    <th className="px-5 py-4 text-right">
                      <Link href={getSortUrl("visit_type_3")} className="hover:text-amber-600">
                        รับส่งต่อ(3) <SortIcon column="visit_type_3" />
                      </Link>
                    </th>
                    <th className="px-5 py-4 text-right">
                      <Link href={getSortUrl("visit_type_5")} className="hover:text-amber-600">
                        แพทย์ทางไกล(5) <SortIcon column="visit_type_5" />
                      </Link>
                    </th>
                    <th className="px-5 py-4 text-right">
                      <Link href={getSortUrl("total")} className="hover:text-amber-600">
                        2+3+5 <SortIcon column="total" />
                      </Link>
                    </th>
                    <th className="px-5 py-4 text-right">
                      <Link href={getSortUrl("percent")} className="hover:text-amber-600">
                        Percent <SortIcon column="percent" />
                      </Link>
                    </th>
                    <th className="px-5 py-4 text-right">
                      <Link href={getSortUrl("d_update")} className="hover:text-amber-600">
                        อัปเดต <SortIcon column="d_update" />
                      </Link>
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {rows.map((row) => (
                    <tr key={row.visit_date} className="hover:bg-amber-50/40">
                      <td className="whitespace-nowrap px-5 py-4 font-black text-slate-900">
                        {formatThaiDate(row.visit_date)}
                      </td>
                      <NumberCell value={row.visit_type_2} />
                      <NumberCell value={row.visit_type_3} />
                      <NumberCell value={row.visit_type_5} />
                      <NumberCell value={row.total} strong />
                      <td className="whitespace-nowrap px-5 py-4 text-right">
                        <span className="rounded-full bg-slate-100 px-3 py-1 text-sm font-black text-slate-700">
                          {percentFormat.format(row.percent)}%
                        </span>
                      </td>
                      <td className="whitespace-nowrap px-5 py-4 text-right text-[11px] font-bold text-slate-400 tabular-nums">
                        {formatThaiDateTime(row.d_update)}
                      </td>
                    </tr>
                  ))}
                  {rows.length === 0 && (
                    <tr>
                      <td colSpan={7} className="px-5 py-12 text-center font-bold text-slate-400">
                        ไม่พบข้อมูลรายวันของหน่วยบริการนี้
                      </td>
                    </tr>
                  )}
                </tbody>
                <tfoot className="bg-slate-950 text-white">
                  <tr>
                    <td className="px-5 py-4 font-black">รวม</td>
                    <NumberCell value={totals.visit_type_2} footer />
                    <NumberCell value={totals.visit_type_3} footer />
                    <NumberCell value={totals.visit_type_5} footer />
                    <NumberCell value={totals.total} footer />
                    <td className="px-5 py-4 text-right font-black">{percentFormat.format(totalPercent)}%</td>
                    <td className="px-5 py-4" />
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
}: {
  value: number;
  strong?: boolean;
  footer?: boolean;
}) {
  const className = footer
    ? "px-5 py-4 text-right font-black"
    : `whitespace-nowrap px-5 py-4 text-right ${strong ? "font-black text-slate-950" : "font-bold text-slate-700"}`;

  return <td className={className}>{numberFormat.format(value)}</td>;
}
