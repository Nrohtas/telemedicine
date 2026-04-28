import pool from "@/lib/db";
import OnepageSummary from "@/components/OnepageSummary";

export const dynamic = "force-dynamic";

export default async function OnepagePage() {
  try {
    // Query 1: Overall totals
    const overallQuery = `
      SELECT 
        COALESCE(SUM(vtd.visit_type_2), 0) AS visit_type_2,
        COALESCE(SUM(vtd.visit_type_3), 0) AS visit_type_3,
        COALESCE(SUM(vtd.visit_type_5), 0) AS visit_type_5,
        MAX(vtd.visit_date) AS latest_date
      FROM visit_type_daily vtd
      WHERE vtd.visit_date BETWEEN '2026-03-23' AND CURDATE()
    `;
    const [overallRows]: any = await pool.query(overallQuery);
    const overall = (overallRows && overallRows[0]) || {};
    const type2 = Number(overall.visit_type_2) || 0;
    const type3 = Number(overall.visit_type_3) || 0;
    const type5 = Number(overall.visit_type_5) || 0;
    const total235 = type2 + type3 + type5;
    const percentType5 = total235 > 0 ? (type5 / total235) * 100 : 0;
    const latestDate = overall.latest_date;

    // Format date (Real Date)
    const formattedDate = new Date().toLocaleDateString("th-TH", {
      timeZone: "Asia/Bangkok",
      day: "numeric",
      month: "short",
      year: "numeric",
    });

    // Query 2: District data (HDC vs Dashboard)
    const districtQuery = `
      SELECT
        a.amp_name,
        COALESCE(SUM(vtd.visit_type_5), 0) AS hdc_visit_type_5,
        COALESCE(SUM(p.result), 0) AS dashboard_result
      FROM ampur a
      LEFT JOIN hospital h ON h.amp_code = a.amp_code COLLATE utf8mb4_general_ci AND h.status = '1'
      LEFT JOIN (
        SELECT hoscode, COALESCE(SUM(visit_type_5), 0) AS visit_type_5
        FROM visit_type_daily
        WHERE visit_date BETWEEN '2026-03-23' AND CURDATE()
        GROUP BY hoscode
      ) vtd ON vtd.hoscode = h.hospcode COLLATE utf8mb4_general_ci
      LEFT JOIN (
        SELECT hospcode, result
        FROM telemed_hdc
        WHERE b_year = '2569'
      ) p ON p.hospcode = h.hospcode COLLATE utf8mb4_general_ci
      GROUP BY a.amp_code, a.amp_name
      ORDER BY hdc_visit_type_5 DESC
    `;
    const [districtRows]: any = await pool.query(districtQuery);
    const districtData = (districtRows || []).map((r: any) => ({
      name: 'อ.' + (r.amp_name || 'ไม่ระบุ'),
      dashboard: Number(r.hdc_visit_type_5) || 0, // Swapped to match dashboard = visit_type_5
      hdc: Number(r.dashboard_result) || 0,     // Report (Manual)
    }));

    // Query 3: Hospital data (Filtered for hostype_new = 5, 7)
    const hospitalQuery = `
      SELECT
        h.hospname,
        COALESCE(vtd.visit_type_2, 0) AS v2,
        COALESCE(vtd.visit_type_3, 0) AS v3,
        COALESCE(vtd.visit_type_5, 0) AS v5,
        COALESCE(SUM(p.result), 0) AS dashboard_result
      FROM hospital h
      LEFT JOIN (
        SELECT hoscode, 
               COALESCE(SUM(visit_type_2), 0) AS visit_type_2,
               COALESCE(SUM(visit_type_3), 0) AS visit_type_3,
               COALESCE(SUM(visit_type_5), 0) AS visit_type_5
        FROM visit_type_daily
        WHERE visit_date BETWEEN '2026-03-23' AND CURDATE()
        GROUP BY hoscode
      ) vtd ON vtd.hoscode = h.hospcode COLLATE utf8mb4_general_ci
      LEFT JOIN (
        SELECT hospcode, result
        FROM telemed_hdc
        WHERE b_year = '2569'
      ) p ON p.hospcode = h.hospcode COLLATE utf8mb4_general_ci
      WHERE h.status = '1' 
        AND h.hostype_new IN (5, 7)
        AND h.dep_name = 'สำนักงานปลัดกระทรวงสาธารณสุข' COLLATE utf8mb4_general_ci
      GROUP BY h.hospcode, h.hospname
      ORDER BY v5 DESC
    `;
    const [hospitalRows]: any = await pool.query(hospitalQuery);
    const hospitalData = (hospitalRows || []).map((r: any) => {
      const v2 = Number(r.v2) || 0;
      const v3 = Number(r.v3) || 0;
      const v5 = Number(r.v5) || 0;
      const total235 = v2 + v3 + v5;
      const ratio = total235 > 0 ? (v5 / total235) * 100 : 0;

      return {
        name: (r.hospname || '').replace('โรงพยาบาล', 'รพ.') || 'ไม่ระบุชื่อ',
        dashboard: v5, // User requested dashboard = visit_type_5
        hdc: Number(r.dashboard_result) || 0, // Swapping or keeping the other value
        v2,
        v3,
        v5,
        total235,
        ratio: ratio,
      };
    });

    // Calculate Hospital Only totals for Gauge
    const hTotals = hospitalData.reduce((acc: any, r: any) => {
      acc.type5 += r.v5;
      acc.total235 += r.total235;
      return acc;
    }, { type5: 0, total235: 0 });
    const hPercentType5 = hTotals.total235 > 0 ? (hTotals.type5 * 100 / hTotals.total235) : 0;

    // Query 4: Sub-hospitals (รพ.สต.) data for Top 10 and Gauge
    const subhQuery = `
      SELECT
        h.hospname,
        a.amp_name,
        COALESCE(vtd.visit_type_2, 0) AS v2,
        COALESCE(vtd.visit_type_3, 0) AS v3,
        COALESCE(vtd.visit_type_5, 0) AS v5,
        COALESCE(SUM(p.result), 0) AS dashboard_result
      FROM hospital h
      LEFT JOIN ampur a ON a.amp_code = h.amp_code COLLATE utf8mb4_general_ci
      JOIN hostype ht ON h.hostype_new = ht.hostype_new COLLATE utf8mb4_general_ci
      LEFT JOIN (
        SELECT hoscode, 
               COALESCE(SUM(visit_type_2), 0) AS visit_type_2,
               COALESCE(SUM(visit_type_3), 0) AS visit_type_3,
               COALESCE(SUM(visit_type_5), 0) AS visit_type_5
        FROM visit_type_daily
        WHERE visit_date BETWEEN '2026-03-23' AND CURDATE()
        GROUP BY hoscode
      ) vtd ON vtd.hoscode = h.hospcode COLLATE utf8mb4_general_ci
      LEFT JOIN (
        SELECT hospcode, result
        FROM telemed_hdc
        WHERE b_year = '2569'
      ) p ON p.hospcode = h.hospcode COLLATE utf8mb4_general_ci
      WHERE h.status = '1' 
        AND ht.hostype_new IN (8, 18, 21)
        AND h.dep_name = 'สำนักงานปลัดกระทรวงสาธารณสุข' COLLATE utf8mb4_general_ci
      GROUP BY h.hospcode, h.hospname, a.amp_name
      ORDER BY v5 DESC
    `;
    const [subhRows]: any = await pool.query(subhQuery);
    const subhSafeRows = subhRows || [];
    
    // Calculate Sub-hospital totals for Gauge from ALL matching rows
    const subhTotals = subhSafeRows.reduce((acc: any, r: any) => {
      acc.type5 += Number(r.v5) || 0;
      acc.total235 += (Number(r.v2) + Number(r.v3) + Number(r.v5));
      return acc;
    }, { type5: 0, total235: 0 });
    const subhPercentType5 = subhTotals.total235 > 0 ? (subhTotals.type5 * 100 / subhTotals.total235) : 0;

    // Take only top 10 for the chart
    const top10Data = subhSafeRows.slice(0, 10).map((r: any) => ({
      name: (r.hospname || '').replace('โรงพยาบาลส่งเสริมสุขภาพตำบล', 'รพ.สต.') + ' (' + (r.amp_name || 'ไม่ระบุ') + ')',
      dashboard: Number(r.v5) || 0, // Swapped
      hdc: Number(r.dashboard_result) || 0, // Report (Manual)
    }));

    const data = {
      pie: [
        { name: 'ตามนัด(2)', value: type2, fill: '#6EE7B7' }, // Soft Emerald
        { name: 'ส่งต่อ(3)', value: type3, fill: '#FCA5A5' }, // Soft Red
        { name: 'แพทย์ทางไกล(5)', value: type5, fill: '#93C5FD' }, // Soft Blue
      ],
      totals: {
        type5,
        total235,
        percentType5,
      },
      hTotals: {
        type5: hTotals.type5,
        total235: hTotals.total235,
        percentType5: hPercentType5,
      },
      subhTotals: {
        type5: subhTotals.type5,
        total235: subhTotals.total235,
        percentType5: subhPercentType5,
      },
      formattedDate,
      districtData,
      hospitalData,
      top10Data,
    };

    return (
      <main className="min-h-screen bg-slate-50">
        <OnepageSummary data={data} />
      </main>
    );
  } catch (error: any) {
    console.error("OnepagePage Error:", error);
    return (
      <main className="min-h-screen bg-white p-8 flex flex-col items-center justify-center text-center">
        <div className="bg-red-50 p-6 rounded-3xl border border-red-100 max-w-2xl w-full">
          <div className="w-16 h-16 bg-red-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <span className="text-3xl">⚠️</span>
          </div>
          <h1 className="text-xl font-black text-red-900 mb-2">เกิดข้อผิดพลาดในการโหลดข้อมูล</h1>
          <p className="text-red-700 text-sm mb-6">ระบบไม่สามารถดึงข้อมูลจากฐานข้อมูลได้ในขณะนี้</p>
          
          <div className="bg-white/50 rounded-2xl p-4 text-left overflow-auto max-h-60 border border-red-100">
            <p className="text-xs font-mono text-red-600 break-all whitespace-pre-wrap">
              {error.message || 'Unknown error'}
            </p>
            {error.stack && (
              <p className="text-[10px] font-mono text-red-400 mt-2 break-all whitespace-pre-wrap text-opacity-50">
                {error.stack}
              </p>
            )}
          </div>
          
          <a 
            href="/telemedicine/daily/onepage"
            className="mt-6 inline-block px-6 py-2 bg-red-600 text-white rounded-full text-sm font-bold hover:bg-red-700 transition-colors"
          >
            ลองใหม่อีกครั้ง
          </a>
        </div>
      </main>
    );
  }
}
