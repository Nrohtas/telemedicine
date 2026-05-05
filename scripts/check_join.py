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
    
    print("Checking join between hospital and telemed_opd_hdc:")
    query = """
        SELECT COUNT(*) 
        FROM hospital h
        JOIN telemed_opd_hdc th ON h.hospcode = th.hospcode COLLATE utf8mb4_general_ci
        WHERE th.b_year = '2569'
    """
    cursor.execute(query)
    print("Join Count:", cursor.fetchone()[0])
    
    conn.close()
except Exception as e:
    print(f"Error: {e}")
