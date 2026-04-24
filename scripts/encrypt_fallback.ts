import mysql from 'mysql2/promise';
import crypto from 'crypto';

const ALGORITHM = 'aes-256-cbc';
const KEY = Buffer.from('f60767a99f69e8c633e6c0ce59aea2ce', 'hex');
const IV_LENGTH = 16;

function encrypt(text: string | null): string | null {
    if (!text) return null;
    const iv = crypto.randomBytes(IV_LENGTH);
    const cipher = crypto.createCipheriv(ALGORITHM, KEY, iv);
    let encrypted = cipher.update(text, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    return iv.toString('hex') + ':' + encrypted;
}

async function migrate() {
    const connection = await mysql.createConnection({
        host: 'localhost',
        user: 'root',
        password: 'root',
        database: 'telemedicine'
    });

    try {
        console.log('Starting migration...');
        const [rows]: any = await connection.query('SELECT HOSPCODE, SEQ, CID, HN FROM service');
        console.log(`Found ${rows.length} rows to encrypt.`);

        for (const row of rows) {
            const isCidEncrypted = row.CID && row.CID.includes(':');
            const isHnEncrypted = row.HN && row.HN.includes(':');

            const newCid = isCidEncrypted ? row.CID : encrypt(row.CID);
            const newHn = isHnEncrypted ? row.HN : encrypt(row.HN);

            await connection.query(
                'UPDATE service SET CID = ?, HN = ? WHERE HOSPCODE = ? AND SEQ = ?',
                [newCid, newHn, row.HOSPCODE, row.SEQ]
            );
        }

        console.log('Migration completed successfully.');
    } catch (error) {
        console.error('Migration failed:', error);
    } finally {
        await connection.end();
    }
}

migrate();
