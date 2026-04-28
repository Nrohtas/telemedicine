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
      MAX(vtd.visit_date) AS latest_date
    FROM visit_type_daily vtd
    WHERE vtd.visit_date BETWEEN '2026-03-23' AND CURDATE()
  `;
  const [overallRows]: any = await pool.query(overallQuery);
  const overall = overallRows[0];
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
    LEFT JOIN hospital h ON h.amp_code = a.amp_code AND h.status = '1'
    LEFT JOIN (
      SELECT hoscode, COALESCE(SUM(visit_type_5), 0) AS visit_type_5
      FROM visit_type_daily
      WHERE visit_date BETWEEN '2026-03-23' AND CURDATE()
      GROUP BY hoscode
    ) vtd ON vtd.hoscode = h.hospcode
    LEFT JOIN (
      SELECT hospcode, result
      FROM telemed
      WHERE b_year = '2569'
    ) p ON p.hospcode = h.hospcode
    GROUP BY a.amp_code, a.amp_name
    ORDER BY dashboard_result DESC
  `;
  const [districtRows]: any = await pool.query(districtQuery);
  const districtData = districtRows.map((r: any) => ({
    name: 'อ.' + r.amp_name,
    hdc: Number(r.hdc_visit_type_5) || 0,
    dashboard: Number(r.dashboard_result) || 0,
  }));

  // Query 3: Hospital data (Main Hospitals)
  const hospitalQuery = `
    SELECT
      h.hospname,
      COALESCE(SUM(vtd.visit_type_5), 0) AS hdc_visit_type_5,
      COALESCE(SUM(p.result), 0) AS dashboard_result
    FROM hospital h
    LEFT JOIN (
      SELECT hoscode, COALESCE(SUM(visit_type_5), 0) AS visit_type_5
      FROM visit_type_daily
      WHERE visit_date BETWEEN '2026-03-23' AND CURDATE()
      GROUP BY hoscode
    ) vtd ON vtd.hoscode = h.hospcode
    LEFT JOIN (
      SELECT hospcode, result
      FROM telemed
      WHERE b_year = '2569'
    ) p ON p.hospcode = h.hospcode
    WHERE h.status = '1' 
      AND h.hostype_new IN (5, 7, 11, 12)
      AND h.dep_name = 'สำนักงานปลัดกระทรวงสาธารณสุข'
    GROUP BY h.hospcode, h.hospname
    ORDER BY dashboard_result DESC
  `;
  const [hospitalRows]: any = await pool.query(hospitalQuery);
  const hospitalData = hospitalRows.map((r: any) => ({
    name: r.hospname.replace('โรงพยาบาล', 'รพ.'),
    hdc: Number(r.hdc_visit_type_5) || 0,
    dashboard: Number(r.dashboard_result) || 0,
  }));

  // Query 4: Top 10 Sub-hospitals (รพ.สต.)
  const top10Query = `
    SELECT
      h.hospname,
      a.amp_name,
      COALESCE(SUM(vtd.visit_type_5), 0) AS hdc_visit_type_5,
      COALESCE(SUM(p.result), 0) AS dashboard_result
    FROM hospital h
    LEFT JOIN ampur a ON a.amp_code = h.amp_code
    LEFT JOIN (
      SELECT hoscode, COALESCE(SUM(visit_type_5), 0) AS visit_type_5
      FROM visit_type_daily
      WHERE visit_date BETWEEN '2026-03-23' AND CURDATE()
      GROUP BY hoscode
    ) vtd ON vtd.hoscode = h.hospcode
    LEFT JOIN (
      SELECT hospcode, result
      FROM telemed
      WHERE b_year = '2569'
    ) p ON p.hospcode = h.hospcode
    WHERE h.status = '1' 
      AND h.hostype_new IN (8, 13, 18, 21)
      AND h.dep_name = 'สำนักงานปลัดกระทรวงสาธารณสุข'
    GROUP BY h.hospcode, h.hospname, a.amp_name
    ORDER BY dashboard_result DESC, hdc_visit_type_5 DESC
    LIMIT 10
  `;
  const [top10Rows]: any = await pool.query(top10Query);
  const top10Data = top10Rows.map((r: any) => ({
    name: r.hospname.replace('โรงพยาบาลส่งเสริมสุขภาพตำบล', 'รพ.สต.') + ' (' + r.amp_name + ')',
    hdc: Number(r.hdc_visit_type_5) || 0,
    dashboard: Number(r.dashboard_result) || 0,
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
}
