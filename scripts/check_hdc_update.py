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

try:
    conn = pymysql.connect(
        host=DB_HOST,
        user=DB_USER,
        password=DB_PASS,
        database=DB_NAME,
        port=DB_PORT
    )
    cursor = conn.cursor()
    
    print("Checking hdc_update values in telemed_opd_hdc:")
    cursor.execute("SELECT hdc_update, COUNT(*) FROM telemed_opd_hdc GROUP BY hdc_update")
    for row in cursor.fetchall():
        print(row)
    
    conn.close()
except Exception as e:
    print(f"Error: {e}")
