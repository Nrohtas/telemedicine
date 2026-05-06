import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import pool from "@/lib/db";

export const dynamic = "force-dynamic";

interface RemedRecord {
  hoscode: string;
  hosname: string;
  visit_date: string;
  count_case_dx_rx_same_prev_vst: number;
}

interface RemedGridRow {
  hoscode: string;
  hosname: string;
  total: number;
  counts: Record<string, number>;
}

const numberFormat = new Intl.NumberFormat("th-TH");

function formatThaiDate(value: string) {
  return new Date(`${value}T00:00:00+07:00`).toLocaleDateString("th-TH", {
    day: "2-digit",
    month: "short",
    year: "2-digit",
  });
}

async function getRemedData() {
  const [dateRows]: any = await pool.query(`
    SELECT DATE_FORMAT(visit_date, '%Y-%m-%d') AS visit_date
    FROM remed_count
    GROUP BY visit_date
    ORDER BY visit_date DESC
  `);

  const dates: string[] = dateRows.map((row: any) => row.visit_date as string);

  const [recordRows]: any = await pool.query(`
    SELECT
      r.hoscode,
      COALESCE(h.hospname, 'ไม่พบชื่อหน่วยบริการ') AS hosname,
      DATE_FORMAT(r.visit_date, '%Y-%m-%d') AS visit_date,
      COALESCE(r.count_case_dx_rx_same_prev_vst, 0) AS count_case_dx_rx_same_prev_vst
    FROM remed_count r
    LEFT JOIN hospital h ON h.hospcode = r.hoscode COLLATE utf8mb4_general_ci
    ORDER BY h.hospname ASC, r.hoscode ASC, r.visit_date DESC
  `);

  const rowMap = new Map<string, RemedGridRow>();

  for (const record of recordRows as RemedRecord[]) {
    const current = rowMap.get(record.hoscode) ?? {
      hoscode: record.hoscode,
      hosname: record.hosname,
      total: 0,
      counts: {},
    };

    const count = Number(record.count_case_dx_rx_same_prev_vst) || 0;
    current.counts[record.visit_date] = count;
    current.total += count;
    rowMap.set(record.hoscode, current);
  }

  const rows = Array.from(rowMap.values()).sort((a, b) => {
    if (b.total !== a.total) return b.total - a.total;
    return a.hoscode.localeCompare(b.hoscode);
  });

  const dateTotals = dates.reduce<Record<string, number>>((sum, date) => {
    sum[date] = rows.reduce((total, row) => total + (row.counts[date] ?? 0), 0);
    return sum;
  }, {});

  const grandTotal = rows.reduce((sum, row) => sum + row.total, 0);

  return { dates, rows, dateTotals, grandTotal };
}

export default async function RemedPage() {
  const { dates, rows, dateTotals, grandTotal } = await getRemedData();
  const dateRange =
    dates.length > 0 ? `ข้อมูล ${formatThaiDate(dates[0])} ย้อนไปถึง ${formatThaiDate(dates[dates.length - 1])}` : "-";

  return (
    <main className="min-h-screen bg-slate-50 pb-8">
      <Navbar showFilters={false} />

      <section className="px-4 md:px-6 mt-4">
        <div className="mx-auto max-w-[1600px] space-y-4">
          <div className="rounded-lg border border-slate-200 bg-white px-4 py-3 shadow-sm">
            <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
                  <h1 className="text-xl font-black text-slate-950 md:text-2xl">เคสที่ได้รับยา REMED</h1>
                  <span className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-black text-emerald-700">
                    {dateRange}
                  </span>
                </div>
                <p className="mt-1 text-xs font-bold text-slate-500">
                  จำนวนผู้ป่วย เบาหวาน-ความดัน ที่ได้การวินิจฉัยเดิม ยาเดิม ปริมาณเท่าเดิม จาก visit ครั้งก่อนหน้า ภายในระยะเวลา 20-100วัน และไม่มีหัตถการในวันที่มา
                </p>
              </div>

              <div className="flex flex-wrap gap-2">
                <CompactMetric label="หน่วยบริการ" value={rows.length} />
                <CompactMetric label="รวมเคส REMED" value={grandTotal} tone="strong" />
              </div>
            </div>
          </div>

          <div className="overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm">
            <div className="flex items-center justify-between border-b border-slate-200 bg-white px-4 py-2">
              <p className="text-sm font-black text-slate-800">ข้อมูลรายหน่วยบริการ</p>
              <p className="text-xs font-bold text-slate-500">หน่วย: จำนวนเคส</p>
            </div>

            <div className="w-full overflow-x-auto overscroll-x-contain touch-pan-x [-webkit-overflow-scrolling:touch]">
              <table className="min-w-max border-separate border-spacing-0 text-[13px]">
                <thead>
                  <tr className="text-left text-[11px] font-black text-slate-600">
                    <ColumnHead className="min-w-24">
                      รหัส
                    </ColumnHead>
                    <ColumnHead className="min-w-56">
                      หน่วยบริการ
                    </ColumnHead>
                    <ColumnHead className="min-w-24 bg-emerald-50 text-right text-emerald-800">
                      รวม
                    </ColumnHead>
                    {dates.map((date, index) => (
                      <ColumnHead key={date} className="min-w-24 text-right">
                        <span className="block">{formatThaiDate(date)}</span>
                        {index === 0 && <span className="block text-[10px] font-bold text-emerald-600">ล่าสุด</span>}
                      </ColumnHead>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {rows.map((row) => (
                    <tr key={row.hoscode} className="group hover:bg-emerald-50/40">
                      <td className="min-w-24 border-b border-slate-100 bg-white px-3 py-2 font-black text-slate-950 group-hover:bg-emerald-50">{row.hoscode}</td>
                      <td className="min-w-56 max-w-72 truncate border-b border-slate-100 bg-white px-3 py-2 font-bold text-slate-700 group-hover:bg-emerald-50">
                        {row.hosname}
                      </td>
                      <NumberCell value={row.total} strong />
                      {dates.map((date) => (
                        <NumberCell key={`${row.hoscode}-${date}`} value={row.counts[date] ?? 0} />
                      ))}
                    </tr>
                  ))}

                  {rows.length === 0 && (
                    <tr>
                      <td colSpan={3 + dates.length} className="px-4 py-10 text-center font-bold text-slate-400">
                        ยังไม่มีข้อมูลในตาราง remed_count
                      </td>
                    </tr>
                  )}
                </tbody>
                {rows.length > 0 && (
                  <tfoot>
                    <tr className="bg-slate-100 text-slate-950">
                      <td className="border-t border-slate-300 bg-slate-100 px-3 py-2 font-black">
                        รวม
                      </td>
                      <td className="min-w-56 border-t border-slate-300 bg-slate-100 px-3 py-2 font-black">
                        ทุกหน่วยบริการ
                      </td>
                      <td className="border-t border-slate-300 bg-emerald-100 px-3 py-2 text-right font-black text-emerald-900">
                        {numberFormat.format(grandTotal)}
                      </td>
                      {dates.map((date) => (
                        <td key={date} className="border-t border-slate-300 px-3 py-2 text-right font-black">
                          {numberFormat.format(dateTotals[date] ?? 0)}
                        </td>
                      ))}
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

function CompactMetric({ label, value, tone }: { label: string; value: number; tone?: "strong" }) {
  return (
    <div
      className={`rounded-md border px-3 py-2 text-right ${tone === "strong" ? "border-emerald-200 bg-emerald-50" : "border-slate-200 bg-slate-50"
        }`}
    >
      <p className="text-[10px] font-black text-slate-500">{label}</p>
      <p className={`text-lg font-black ${tone === "strong" ? "text-emerald-800" : "text-slate-900"}`}>
        {numberFormat.format(value)}
      </p>
    </div>
  );
}

function ColumnHead({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <th
      className={`border-b border-slate-200 bg-slate-100 px-3 py-2 align-middle ${className}`}
    >
      {children}
    </th>
  );
}

function NumberCell({ value, strong = false }: { value: number; strong?: boolean }) {
  const isZero = value === 0;

  return (
    <td
      className={`border-b border-slate-100 px-3 py-2 text-right ${strong ? "bg-emerald-50 font-black text-emerald-900" : "font-bold"
        } ${isZero ? "text-slate-300" : "text-slate-800"}`}
    >
      {numberFormat.format(value)}
    </td>
  );
}
