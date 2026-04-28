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
    const [cols]: any = await pool.query("SHOW COLUMNS FROM hospital");
    console.log("Hospital Columns:", cols.map((c: any) => c.Field).join(", "));

    const [types]: any = await pool.query("SELECT DISTINCT hostype, hostype_new FROM hospital LIMIT 10");
    console.log("Hospital Sample Types:", types);
    
    const [hostypeCols]: any = await pool.query("SHOW TABLES LIKE 'hostype'");
    if (hostypeCols.length > 0) {
        const [hcols]: any = await pool.query("SHOW COLUMNS FROM hostype");
        console.log("Hostype Table Columns:", hcols.map((c: any) => c.Field).join(", "));
    } else {
        console.log("Hostype table does not exist!");
    }

  } catch (err) {
    console.error(err);
  } finally {
    await pool.end();
  }
}

check();
