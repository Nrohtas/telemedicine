import pool from "@/lib/db";
import OnepageSummary from "@/components/OnepageSummary";

export const dynamic = "force-dynamic";

export default async function OnepagePage() {
  // Query 1: Overall totals
  const overallQuery = `
    SELECT 
      COALESCE(SUM(vtd.visit_type_2), 0) AS visit_type_2,
      COALESCE(SUM(vtd.visit_type_3), 0) AS visit_type_3,
      COALESCE(SUM(vtd.visit_type_5), 0) AS visit_type_5,
      (SELECT COALESCE(SUM(opd), 0) FROM telemed_opd_hdc WHERE b_year = '2569') AS hdc_opd,
      (SELECT COALESCE(SUM(telemedicine), 0) FROM telemed_opd_hdc WHERE b_year = '2569') AS hdc_tele,
      (SELECT MAX(d_update) FROM visit_type_daily) AS last_update
    FROM visit_type_daily vtd
    WHERE vtd.visit_date BETWEEN '2026-01-01' AND CURDATE()
  `;
    try {
    const [overallRows]: any = await pool.query(overallQuery);
    const overall = (overallRows && overallRows[0]) || {};
    const type2 = Number(overall.visit_type_2) || 0;
    const type3 = Number(overall.visit_type_3) || 0;
    const type5 = Number(overall.visit_type_5) || 0;
    const total235 = type2 + type3 + type5;
    const percentType5 = total235 > 0 ? (type5 / total235) * 100 : 0;

    // Format date (Current Date)
    const formattedDate = new Date().toLocaleDateString("th-TH", {
      timeZone: "Asia/Bangkok",
      day: "numeric",
      month: "short",
      year: "numeric",
      calendar: 'buddhist'
    } as any);

    // Query 2: District data (HDC vs Dashboard)
    const districtQuery = `
      SELECT
        a.amp_name,
        COALESCE(SUM(vtd.visit_type_5), 0) AS hdc_visit_type_5,
        COALESCE(SUM(p.result), 0) AS dashboard_result,
        COALESCE(SUM(p.opd), 0) AS hdc_opd
      FROM ampur a
      LEFT JOIN hospital h ON h.amp_code = a.amp_code COLLATE utf8mb4_general_ci AND h.status = '1'
      LEFT JOIN (
        SELECT hoscode, COALESCE(SUM(visit_type_5), 0) AS visit_type_5
        FROM visit_type_daily
        WHERE visit_date BETWEEN '2026-01-01' AND CURDATE()
        GROUP BY hoscode
      ) vtd ON vtd.hoscode = h.hospcode COLLATE utf8mb4_general_ci
      LEFT JOIN (
        SELECT hospcode, telemedicine AS result, opd
        FROM telemed_opd_hdc
        WHERE b_year = '2569'
      ) p ON p.hospcode = h.hospcode COLLATE utf8mb4_general_ci
      GROUP BY a.amp_code, a.amp_name
      ORDER BY hdc_visit_type_5 DESC
    `;
    const [districtRows]: any = await pool.query(districtQuery);
    const districtData = (districtRows || []).map((r: any) => ({
      name: 'อ.' + (r.amp_name || 'ไม่ระบุ'),
      dashboard: Number(r.hdc_visit_type_5) || 0,
      hdc: Number(r.dashboard_result) || 0,
      hdc_opd: Number(r.hdc_opd) || 0,
    })).sort((a: any, b: any) => {
      const aPct = a.hdc_opd > 0 ? (a.hdc / a.hdc_opd) : 0;
      const bPct = b.hdc_opd > 0 ? (b.hdc / b.hdc_opd) : 0;
      return bPct - aPct;
    });

    // Query 3: Hospital data (Filtered for hostype_new = 5, 7)
    const hospitalQuery = `
      SELECT
        h.hospname,
        COALESCE(vtd.visit_type_2, 0) AS v2,
        COALESCE(vtd.visit_type_3, 0) AS v3,
        COALESCE(vtd.visit_type_5, 0) AS v5,
        COALESCE(SUM(p.result), 0) AS dashboard_result,
        COALESCE(SUM(p.opd), 0) AS hdc_opd
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
        SELECT hospcode, telemedicine AS result, opd
        FROM telemed_opd_hdc
        WHERE b_year = '2569'
      ) p ON p.hospcode = h.hospcode COLLATE utf8mb4_general_ci
      WHERE h.status = '1' 
        AND h.hostype_new IN (5, 7)
        AND h.dep_name = 'สำนักงานปลัดกระทรวงสาธารณสุข' COLLATE utf8mb4_general_ci
      GROUP BY h.hospcode, h.hospname
      ORDER BY v5 DESC, dashboard_result DESC
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
        dashboard: v5,
        hdc: Number(r.dashboard_result) || 0,
        v2,
        v3,
        v5,
        total235,
        ratio: ratio,
        hdc_opd: Number(r.hdc_opd) || 0,
      };
    }).sort((a: any, b: any) => {
      const aPct = a.hdc_opd > 0 ? (a.hdc / a.hdc_opd) : 0;
      const bPct = b.hdc_opd > 0 ? (b.hdc / b.hdc_opd) : 0;
      return bPct - aPct;
    });

    const hTotals = hospitalData.reduce((acc: any, r: any) => {
      acc.type5 += r.v5;
      acc.total235 += r.total235;
      acc.hdc_tele += r.hdc;
      acc.hdc_opd += r.hdc_opd;
      return acc;
    }, { type5: 0, total235: 0, hdc_tele: 0, hdc_opd: 0 });
    const hPercentType5 = hTotals.total235 > 0 ? (hTotals.type5 * 100 / hTotals.total235) : 0;
    const hHdcPercent = (hTotals.hdc_opd + hTotals.hdc_tele) > 0 ? (hTotals.hdc_tele * 100 / (hTotals.hdc_opd + hTotals.hdc_tele)) : 0;

    // Query 4: Sub-hospitals (รพ.สต.) data for Top 10 and Gauge
    const subhQuery = `
      SELECT
        h.hospname,
        a.amp_name,
        COALESCE(vtd.visit_type_2, 0) AS v2,
        COALESCE(vtd.visit_type_3, 0) AS v3,
        COALESCE(vtd.visit_type_5, 0) AS v5,
        COALESCE(SUM(p.result), 0) AS dashboard_result,
        COALESCE(SUM(p.opd), 0) AS hdc_opd
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
        SELECT hospcode, telemedicine AS result, opd
        FROM telemed_opd_hdc
        WHERE b_year = '2569'
      ) p ON p.hospcode = h.hospcode COLLATE utf8mb4_general_ci
      WHERE h.status = '1' 
        AND ht.hostype_new IN (8, 18, 21)
        AND h.dep_name = 'สำนักงานปลัดกระทรวงสาธารณสุข' COLLATE utf8mb4_general_ci
      GROUP BY h.hospcode, h.hospname, a.amp_name
      ORDER BY dashboard_result DESC, v5 DESC

    `;
    const [subhRows]: any = await pool.query(subhQuery);
    const subhSafeRows = subhRows || [];

    const subhTotals = subhSafeRows.reduce((acc: any, r: any) => {
      acc.type5 += Number(r.v5) || 0;
      acc.total235 += (Number(r.v2) + Number(r.v3) + Number(r.v5));
      acc.hdc_tele += Number(r.dashboard_result) || 0;
      acc.hdc_opd += Number(r.hdc_opd) || 0;
      return acc;
    }, { type5: 0, total235: 0, hdc_tele: 0, hdc_opd: 0 });
    const subhPercentType5 = subhTotals.total235 > 0 ? (subhTotals.type5 * 100 / subhTotals.total235) : 0;
    const subhHdcPercent = (subhTotals.hdc_opd + subhTotals.hdc_tele) > 0 ? (subhTotals.hdc_tele * 100 / (subhTotals.hdc_opd + subhTotals.hdc_tele)) : 0;

    // Final aggregate for subhTotals to pass to component
    const subhTotalsFinal = {
      ...subhTotals,
      percentType5: subhPercentType5,
      hdc_percent: subhHdcPercent
    };

    const top10Data = subhSafeRows.slice(0, 10).map((r: any) => ({
      name: (r.hospname || '').replace('โรงพยาบาลส่งเสริมสุขภาพตำบล', 'รพ.สต.') + ' (' + (r.amp_name || 'ไม่ระบุ') + ')',
      dashboard: Number(r.v5) || 0,
      hdc: Number(r.dashboard_result) || 0,
      hdc_opd: Number(r.hdc_opd) || 0,
    }));
    const data = {
      pie: [
        { name: 'ตามนัด (2)', value: type2, fill: '#6EE7B7' },
        { name: 'ส่งต่อ (3)', value: type3, fill: '#FCA5A5' },
        { name: 'แพทย์ทางไกล (5)', value: type5, fill: '#93C5FD' },
      ],
      totals: {
        type5,
        total235,
        percentType5,
        hdc_opd: Number(overall.hdc_opd) || 0,
        hdc_tele: Number(overall.hdc_tele) || 0,
        hdc_percent: (Number(overall.hdc_opd) + Number(overall.hdc_tele)) > 0 ? (Number(overall.hdc_tele) / (Number(overall.hdc_opd) + Number(overall.hdc_tele))) * 100 : 0
      },
      hTotals: {
        type5: hTotals.type5,
        total235: hTotals.total235,
        percentType5: hPercentType5,
        hdc_tele: hTotals.hdc_tele,
        hdc_opd: hTotals.hdc_opd,
        hdc_percent: hHdcPercent
      },
      subhTotals: subhTotalsFinal,
      formattedDate,
      districtData,
      hospitalData,
      top10Data,
    };

    return <OnepageSummary data={data} />;
  } catch (error) {
    console.error('Error loading OnepagePage:', error);
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-red-600">ขออภัย เกิดข้อผิดพลาดในการโหลดข้อมูล</h1>
          <p className="text-slate-500 mt-2">กรุณาลองใหม่อีกครั้งในภายหลัง</p>
        </div>
      </div>
    );
  }
}
