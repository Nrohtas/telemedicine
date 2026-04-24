import crypto from 'crypto';

const ALGORITHM = 'aes-256-cbc';
const KEY = Buffer.from(process.env.CRYPTO_KEY || '25f1a66955d0ae91054377aec8196ef22c6ad11808072b2914b5afb60f2e5212', 'hex');
const IV_LENGTH = 16;

export function encrypt(text: string | null): string | null {
    if (!text) return null;
    
    const iv = crypto.randomBytes(IV_LENGTH);
    const cipher = crypto.createCipheriv(ALGORITHM, KEY, iv);
    let encrypted = cipher.update(text, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    
    // Store IV with encrypted text
    return iv.toString('hex') + ':' + encrypted;
}

export function decrypt(text: string | null): string | null {
    if (!text) return null;
    
    try {
        const textParts = text.split(':');
        const iv = Buffer.from(textParts.shift()!, 'hex');
        const encryptedText = Buffer.from(textParts.join(':'), 'hex');
        const decipher = crypto.createDecipheriv(ALGORITHM, KEY, iv);
        let decrypted = decipher.update(encryptedText).toString('utf8');
        decrypted += decipher.final('utf8');
        return decrypted;
    } catch (error) {
        return text; // Return original if decryption fails (might not be encrypted)
    }
}
