import os
import pymysql
from dotenv import load_dotenv

dotenv_path = os.path.join(os.path.dirname(__file__), '..', '.env')
load_dotenv(dotenv_path)

DB_HOST = os.getenv("DB_HOST", "localhost")
DB_USER = os.getenv("DB_USER", "root")
DB_PASS = os.getenv("DB_PASSWORD", "")
DB_NAME = os.getenv("DB_NAME", "telemedicine")
DB_PORT = int(os.getenv("DB_PORT", 3306))

def get_query(types):
    return f"""
        SELECT 
            h.hospcode, 
            h.hospname, 
            h.amp_name,
            COALESCE(hdc.hdc_result, 0) as hdc_tele
        FROM hospital h
        LEFT JOIN (
            SELECT 
                hospcode,
                SUM(result) as hdc_result
            FROM telemed_hdc
            WHERE b_year = '2569'
            GROUP BY hospcode
        ) hdc ON h.hospcode = hdc.hospcode COLLATE utf8mb4_general_ci
        WHERE h.status = '1'
        AND h.hostype_new IN ({','.join(map(str, types))})
        AND h.dep_name = 'สำนักงานปลัดกระทรวงสาธารณสุข' COLLATE utf8mb4_general_ci
        ORDER BY hdc_tele DESC
        LIMIT 10
    """

try:
    conn = pymysql.connect(
        host=DB_HOST,
        user=DB_USER,
        password=DB_PASS,
        database=DB_NAME,
        port=DB_PORT
    )
    cursor = conn.cursor()
    
    print("Testing Hospital Query (5, 7, 11, 12):")
    cursor.execute(get_query([5, 7, 11, 12]))
    rows = cursor.fetchall()
    print(f"Found {len(rows)} rows.")
    for row in rows:
        print(row)

    print("\nTesting Primary Care Query (8, 13, 18, 21):")
    cursor.execute(get_query([8, 13, 18, 21]))
    rows = cursor.fetchall()
    print(f"Found {len(rows)} rows.")
    for row in rows:
        print(row)
    
    conn.close()
except Exception as e:
    print(f"Error: {e}")
