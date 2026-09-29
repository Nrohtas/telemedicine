import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import pool from "@/lib/db";
import Link from "next/link";

export const dynamic = "force-dynamic";

interface HospitalEligible {
  hospcode: string;
  hospname: string;
  amp_code: string;
  amp_name: string;
  dm: number;
}

async function getEligibleData() {
  try {
    const query = `
      SELECT 
        h.hospcode,
        h.hospname,
        h.amp_code,
        COALESCE(a.amp_name, h.amp_name) AS amp_name
      FROM hospital h
      LEFT JOIN ampur a 
        ON h.amp_code = a.amp_code COLLATE utf8mb4_general_ci
      WHERE h.status = '1'
        AND h.hostype_new IN (5, 7)
      ORDER BY h.amp_code ASC, h.hospcode ASC
    `;

    const [rows]: any = await pool.query(query);

    const hospitals: HospitalEligible[] = (rows || []).map((row: any) => ({
      hospcode: row.hospcode,
      hospname: row.hospname,
      amp_code: row.amp_code,
      amp_name: row.amp_name || "-",
      dm: 0, // รอข้อมูล DM ภายหลัง
    }));

    const totals = {
      hospital_count: hospitals.length,
      dm: hospitals.reduce((acc, curr) => acc + curr.dm, 0),
    };

    return {
      hospitals,
      totals,
    };
  } catch (error) {
    console.error("Error fetching should hospital data:", error);
    return {
      hospitals: [],
      totals: {
        hospital_count: 0,
        dm: 0,
      },
    };
  }
}

export default async function ShouldPage() {
  const { hospitals, totals } = await getEligibleData();

  return (
    <main className="min-h-screen flex flex-col bg-[#FDFBFF]">
      <Navbar showFilters={false} />

      <section className="px-4 md:px-6 mt-4 flex-1">
        <div className="mx-auto max-w-[1200px] space-y-4">
          {/* Header Card */}
          <div className="rounded-2xl border border-slate-200/70 bg-white/80 backdrop-blur px-5 py-4 shadow-sm">
            <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
              <div>
                <div className="flex items-center gap-3">
                  <div className="p-2.5 bg-purple-50 text-purple-600 rounded-xl border border-purple-100/60 shadow-sm">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <div>
                    <h1 className="text-xl md:text-2xl font-black text-slate-800 tracking-tight">
                      Should
                    </h1>
                    <p className="text-xs font-semibold text-slate-500">
                      ติดตามข้อมูล DM หน่วยบริการโรงพยาบาล (รพ.) จังหวัดพิษณุโลก
                    </p>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-black bg-purple-50 text-purple-700 border border-purple-100">
                  <span className="h-2 w-2 rounded-full bg-purple-500 animate-pulse" />
                  รอข้อมูล DM ภายหลัง
                </span>
              </div>
            </div>
          </div>

          {/* Hospital Table */}
          <div className="rounded-2xl border border-slate-200/70 bg-white shadow-sm overflow-hidden">
            <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-purple-500" />
                <h2 className="text-sm font-black text-slate-800 uppercase tracking-wider">
                  หน่วยบริการโรงพยาบาล (รพ.)
                </h2>
              </div>
              <span className="text-xs font-semibold text-slate-400">
                ทั้งหมด {hospitals.length} แห่ง
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-sm">
                <thead>
                  <tr className="bg-slate-50/70 text-slate-500 text-xs font-black uppercase tracking-wider border-b border-slate-100">
                    <th className="py-3.5 px-6">หน่วยบริการ (รพ.)</th>
                    <th className="py-3.5 px-6 text-right">DM</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-medium">
                  {hospitals.map((h) => (
                    <tr key={h.hospcode} className="hover:bg-purple-50/30 transition-colors">
                      <td className="py-3.5 px-6">
                        <Link
                          href={`/hospital?amp_code=${h.amp_code}`}
                          className="font-bold text-slate-800 hover:text-purple-600 transition-colors"
                        >
                          {h.hospname}
                        </Link>
                        <span className="ml-2 text-xs font-semibold text-slate-400">
                          ({h.hospcode})
                        </span>
                      </td>
                      <td className="py-3.5 px-6 text-right font-bold text-slate-700">
                        {h.dm > 0 ? h.dm.toLocaleString() : "-"}
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr className="bg-purple-50/30 font-black text-slate-800 border-t border-purple-100/60">
                    <td className="py-3.5 px-6">
                      รวมทั้งจังหวัด ({totals.hospital_count} แห่ง)
                    </td>
                    <td className="py-3.5 px-6 text-right text-purple-700">
                      {totals.dm > 0 ? totals.dm.toLocaleString() : "-"}
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
