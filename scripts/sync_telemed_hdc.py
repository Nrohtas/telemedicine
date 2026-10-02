import os
import requests
import pymysql
import sys
from datetime import datetime
from dotenv import load_dotenv

# Load .env file from the parent directory (project root)
dotenv_path = os.path.join(os.path.dirname(__file__), '..', '.env')
load_dotenv(dotenv_path)

DB_HOST = os.getenv("DB_HOST", "localhost")
DB_USER = os.getenv("DB_USER", "root")
DB_PASS = os.getenv("DB_PASSWORD", "")
DB_NAME = os.getenv("DB_NAME", "telemedicine")
DB_PORT = int(os.getenv("DB_PORT", 3306))

API_URL = "https://opendata.moph.go.th/api/report_data"

def sync_year(target_year: str):
    print(f"[{datetime.now()}] Starting sync for telemed_hdc for fiscal year {target_year}...")
    
    # 1. Fetch Data
    try:
        # We use POST as tested in scratch scripts
        payload = {
            "tableName": "s_telemed_hosp",
            "year": target_year,
            "province": "65"
        }
        print(f"Fetching data from {API_URL} for year {target_year}, province 65...")
        response = requests.post(API_URL, json=payload, timeout=60)
        response.raise_for_status()
        data = response.json()
    except Exception as e:
        print(f"Error fetching API for year {target_year}: {e}")
        if 'response' in locals() and response is not None:
            print(f"Response content: {response.text[:200]}")
        return

    # Validate data structure
    records = data if isinstance(data, list) else data.get("data", [])
    
    if not records:
        print(f"No data received from API or data is empty for year {target_year}.")
        log_to_db(0, 0, 0)
        return

    # 2. Filter Data
    # The API might already filter by province, but we double-check for safety
    filtered_data = []
    for row in records:
        areacode = str(row.get("areacode", ""))
        b_year = str(row.get("b_year", ""))
        # Province 65 starts with "65" in areacode
        if areacode.startswith("65") and b_year == target_year:
            filtered_data.append(row)

    total_count = len(records)
    matched_count = len(filtered_data)
    print(f"Total fetched: {total_count}. Matched (P65, Y{target_year}): {matched_count}.")

    if matched_count == 0:
        log_to_db(total_count, 0, 0)
        print(f"No matched data to insert for year {target_year}.")
        return

    # 3. Insert into Database
    h_y = 0 # Success count
    h_n = 0 # Error count
    
    try:
        # Connect to MySQL
        conn = pymysql.connect(
            host=DB_HOST,
            user=DB_USER,
            password=DB_PASS,
            database=DB_NAME,
            port=DB_PORT,
            cursorclass=pymysql.cursors.DictCursor
        )
        cursor = conn.cursor()

        # 1. Insert into telemed_hdc (Requested landing table)
        insert_hdc_sql = """
            INSERT INTO telemed_hdc (id, hospcode, areacode, date_com, b_year, target, result, hdc_update, percent, d_update)
            VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, NOW())
            ON DUPLICATE KEY UPDATE 
                areacode = VALUES(areacode),
                date_com = VALUES(date_com),
                target = VALUES(target),
                result = VALUES(result),
                hdc_update = VALUES(hdc_update),
                percent = VALUES(percent),
                d_update = NOW()
        """

        # 2. Insert into telemed_opd_hdc (Dashboard table)
        insert_opd_sql = """
            INSERT INTO telemed_opd_hdc (id, hospcode, b_year, opd, telemedicine, percent, hdc_update, d_update)
            VALUES (%s, %s, %s, %s, %s, %s, %s, NOW())
            ON DUPLICATE KEY UPDATE 
                id = VALUES(id),
                opd = VALUES(opd),
                telemedicine = VALUES(telemedicine),
                percent = VALUES(percent),
                hdc_update = VALUES(hdc_update),
                d_update = NOW()
        """

        # 3. Insert / update into telemed table
        insert_telemed_sql = """
            INSERT INTO telemed (id, hospcode, b_year, hdc, result, hdc_date, result_date)
            VALUES (%s, %s, %s, %s, %s, %s, %s)
            ON DUPLICATE KEY UPDATE 
                id = VALUES(id),
                b_year = VALUES(b_year),
                hdc = VALUES(hdc),
                result = COALESCE(moph, 0) + COALESCE(buddycare, 0) + VALUES(hdc) + COALESCE(healthconnex, 0),
                hdc_date = VALUES(hdc_date),
                result_date = CASE 
                    WHEN VALUES(hdc_date) IS NOT NULL AND (result_date IS NULL OR VALUES(hdc_date) > result_date) THEN VALUES(hdc_date) 
                    ELSE result_date 
                END
        """

        for item in filtered_data:
            try:
                hospcode = item.get("hospcode")
                b_year = item.get("b_year")
                if not hospcode or not b_year:
                    continue

                record_id = f"{hospcode}_{b_year}"
                target = int(item.get("target") or 0)
                result = int(item.get("result") or 0)
                percent = (result * 100 / target) if target > 0 else 0
                
                date_com = item.get("date_com", "")
                hdc_update = None
                if date_com and len(date_com) >= 8:
                    try:
                        hdc_update = f"{date_com[:4]}-{date_com[4:6]}-{date_com[6:8]}"
                    except:
                        pass
                
                # Insert into telemed_hdc
                val_hdc = (record_id, hospcode, item.get("areacode"), date_com, b_year, target, result, hdc_update, percent)
                cursor.execute(insert_hdc_sql, val_hdc)

                # Insert into telemed_opd_hdc
                val_opd = (record_id, hospcode, b_year, target, result, percent, hdc_update)
                cursor.execute(insert_opd_sql, val_opd)

                # Insert into telemed
                val_telemed = (record_id, hospcode, b_year, result, result, hdc_update, hdc_update)
                cursor.execute(insert_telemed_sql, val_telemed)

                h_y += 1
            except Exception as e:
                print(f"Failed to insert row {item.get('hospcode')}: {e}")
                h_n += 1

        conn.commit()
        print(f"Successfully processed {h_y} records. Failed: {h_n}.")

    except Exception as e:
        print(f"Database error during insert: {e}")
        h_n = matched_count - h_y
    finally:
        if 'cursor' in locals():
            cursor.close()
        if 'conn' in locals():
            conn.close()

    # 4. Log to hdc_api table
    log_to_db(total_count, h_y, h_n)

def log_to_db(h_count, h_y, h_n):
    print(f"Logging result: total={h_count}, success={h_y}, error={h_n}")
    try:
        conn = pymysql.connect(
            host=DB_HOST,
            user=DB_USER,
            password=DB_PASS,
            database=DB_NAME,
            port=DB_PORT
        )
        cursor = conn.cursor()
        
        log_sql = """
            INSERT INTO hdc_api (h_count, h_y, h_n, d_update)
            VALUES (%s, %s, %s, NOW())
        """
        cursor.execute(log_sql, (h_count, h_y, h_n))
        conn.commit()
    except Exception as e:
        print(f"Failed to log to hdc_api: {e}")
    finally:
        if 'cursor' in locals():
            cursor.close()
        if 'conn' in locals():
            conn.close()

def main():
    years = sys.argv[1:] if len(sys.argv) > 1 else ["2569", "2570"]
    for y in years:
        sync_year(str(y))

if __name__ == "__main__":
    main()

