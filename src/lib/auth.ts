import { SignJWT, jwtVerify } from 'jose';
import bcrypt from 'bcryptjs';

const SECRET_KEY = process.env.JWT_SECRET || 'default_secret_please_change_in_env';
const key = new TextEncoder().encode(SECRET_KEY);

export async function hashPassword(password: string): Promise<string> {
    const salt = await bcrypt.genSalt(10);
    return bcrypt.hash(password, salt);
}

export async function comparePassword(password: string, hash: string): Promise<boolean> {
    // Check if the hash starts with $2a$, $2b$, or $2y$ (common bcrypt prefixes)
    const isBcryptHash = /^\$2[ayb]\$.{56}$/.test(hash);

    if (isBcryptHash) {
        return bcrypt.compare(password, hash);
    }

    // Fallback for plain text passwords (not recommended for production but needed for migration/current DB state)
    return password === hash;
}

export async function signJWT(payload: any): Promise<string> {
    return new SignJWT(payload)
        .setProtectedHeader({ alg: 'HS256' })
        .setIssuedAt()
        .setExpirationTime('24h') // Token expires in 24 hours
        .sign(key);
}

export async function verifyJWT(token: string): Promise<any> {
    try {
        const { payload } = await jwtVerify(token, key, {
            algorithms: ['HS256'],
        });
        return payload;
    } catch (error) {
        return null;
    }
}
