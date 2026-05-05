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

def check_hospitals(types):
    conn = pymysql.connect(
        host=DB_HOST,
        user=DB_USER,
        password=DB_PASS,
        database=DB_NAME,
        port=DB_PORT
    )
    cursor = conn.cursor()
    query = f"""
        SELECT COUNT(*) 
        FROM hospital h
        WHERE h.status = '1'
        AND h.hostype_new IN ({','.join(map(str, types))})
        AND h.dep_name = 'สำนักงานปลัดกระทรวงสาธารณสุข' COLLATE utf8mb4_general_ci
    """
    cursor.execute(query)
    count = cursor.fetchone()[0]
    conn.close()
    return count

try:
    print(f"Hospitals (5, 7, 11, 12): {check_hospitals([5, 7, 11, 12])}")
    print(f"Primary Care (8, 13, 18, 21): {check_hospitals([8, 13, 18, 21])}")
except Exception as e:
    print(f"Error: {e}")
