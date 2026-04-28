import mysql from 'mysql2/promise';
import dotenv from 'dotenv';
dotenv.config();

async function check() {
  const pool = mysql.createPool({
    host: process.env.DB_HOST,
    port: Number(process.env.DB_PORT),
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
  });

  try {
    const [vtdCols]: any = await pool.query("SHOW COLUMNS FROM visit_type_daily");
    console.log("visit_type_daily Columns:", vtdCols.map((c: any) => c.Field).join(", "));

    const [hdcCols]: any = await pool.query("SHOW COLUMNS FROM telemed_hdc");
    console.log("telemed_hdc Columns:", hdcCols.map((c: any) => c.Field).join(", "));

    const [vtdSample]: any = await pool.query("SELECT * FROM visit_type_daily LIMIT 1");
    console.log("visit_type_daily Sample:", vtdSample);

  } catch (err) {
    console.error("DB Error:", err);
  } finally {
    await pool.end();
  }
}

check();
