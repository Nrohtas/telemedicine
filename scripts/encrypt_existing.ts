import dotenv from 'dotenv';
import path from 'path';
dotenv.config({ path: path.resolve(process.cwd(), '.env') });
import pool from '../src/lib/db';
import { encrypt } from '../src/lib/crypto';

async function migrate() {
    try {
        console.log('Starting migration...');
        const [rows]: any = await pool.query('SELECT HOSPCODE, SEQ, CID, HN FROM service');
        console.log(`Found ${rows.length} rows to encrypt.`);

        for (const row of rows) {
            // Check if already encrypted (has ':' character)
            const isCidEncrypted = row.CID && row.CID.includes(':');
            const isHnEncrypted = row.HN && row.HN.includes(':');

            const newCid = isCidEncrypted ? row.CID : encrypt(row.CID);
            const newHn = isHnEncrypted ? row.HN : encrypt(row.HN);

            await pool.query(
                'UPDATE service SET CID = ?, HN = ? WHERE HOSPCODE = ? AND SEQ = ?',
                [newCid, newHn, row.HOSPCODE, row.SEQ]
            );
        }

        console.log('Migration completed successfully.');
        process.exit(0);
    } catch (error) {
        console.error('Migration failed:', error);
        process.exit(1);
    }
}

migrate();
