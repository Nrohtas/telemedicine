import { NextResponse } from 'next/server';
import pool from '@/lib/db';
import { signJWT, parseJwt, MophUser } from '@/lib/auth';

export async function GET(request: Request) {
    const { searchParams } = new URL(request.url);
    const code = searchParams.get('code');

    if (!code) {
        return NextResponse.redirect(new URL('/telemedicine/login?error=no_code', request.url));
    }

    try {
        console.log("MOPH Auth: Starting Step 1 (HealthID Exchange)...");
        // Step 1: Exchange Code -> HealthID Token (moph.id.th)
        const healthRes = await fetch(process.env.HEALTH_TOKEN_ENDPOINT!, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                grant_type: 'authorization_code',
                code,
                redirect_uri: process.env.HEALTH_REDIRECT_URI,
                client_id: process.env.HEALTH_CLIENT_ID,
                client_secret: process.env.HEALTH_CLIENT_SECRET
            })
        });

        if (!healthRes.ok) {
            const errText = await healthRes.text();
            console.error("HealthID Token Exchange Failed:", errText);
            throw new Error(`Step 1 Failed: ${errText}`);
        }

        const healthData = await healthRes.json();
        console.log("HealthID Data received:", JSON.stringify(healthData).substring(0, 50) + "...");
        const healthToken = healthData?.data?.access_token || healthData?.access_token;
        if (!healthToken) throw new Error("Step 1 Failed: No Health Token returned");

        // Parse JWT for basic user info
        console.log("MOPH Auth: Parsing JWT...");
        const jwtPayload = parseJwt(healthToken);
        if (!jwtPayload) throw new Error("Step 1 Failed: Could not decode HealthID Token");
        
        const jwtDetails = jwtPayload?.scopes_detail;
        const cid = jwtDetails?.id_card || jwtDetails?.pid;
        console.log("CID found:", cid ? "Yes (Masked)" : "No");

        if (!cid) throw new Error("Step 1 Failed: Could not find CID in token");

        console.log("MOPH Auth: Starting Step 2 (ProviderID Exchange)...");
        // Step 2: Exchange HealthID Token -> ProviderID Token (provider.id.th)
        const providerExchangeRes = await fetch(process.env.PROVIDER_EXCHANGE_ENDPOINT!, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                client_id: process.env.PROVIDER_CLIENT_ID,
                secret_key: process.env.PROVIDER_CLIENT_SECRET,
                token_by: 'Health ID',
                token: healthToken
            })
        });

        if (!providerExchangeRes.ok) {
            const errText = await providerExchangeRes.text();
            console.error("ProviderID Token Exchange Failed:", errText);
            throw new Error(`Step 2 Failed: ${errText}`);
        }

        const providerExchangeData = await providerExchangeRes.json();
        const providerToken = providerExchangeData?.data?.access_token || providerExchangeData?.access_token;
        if (!providerToken) throw new Error("Step 2 Failed: No Provider Token returned");

        console.log("MOPH Auth: Starting Step 3 (Fetch Profile)...");
        // Step 3: Fetch Detailed User Profile (provider.id.th)
        const profileRes = await fetch(process.env.PROVIDER_USERINFO_ENDPOINT!, {
            method: 'GET',
            headers: {
                'client-id': process.env.PROVIDER_CLIENT_ID!,
                'secret-key': process.env.PROVIDER_CLIENT_SECRET!,
                'Authorization': `Bearer ${providerToken}`
            }
        });

        if (!profileRes.ok) {
            const errText = await profileRes.text();
            console.error("Provider Profile Fetch Failed:", errText);
            throw new Error(`Step 3 Failed: ${errText}`);
        }

        const profileRaw = await profileRes.json();
        const profile = profileRaw?.data || profileRaw;
        console.log("Profile received for:", profile?.name_th || "Unknown");

        // Build User Profile Data with deep safety checks
        const org = profile?.organization?.[0] || {};
        const userData: Omit<MophUser, 'id'> = {
            username: String(cid || ''),
            provider_id: String(jwtPayload?.sub || ''),
            hash_cid: String(profile?.hash_cid || jwtDetails?.hash_id_card || ''),
            name_th: String(profile?.name_th || `${jwtDetails?.name || ''} ${jwtDetails?.surname || ''}`).trim() || 'ไม่ระบุชื่อ',
            name_eng: String(profile?.name_eng || ''),
            email: String(profile?.email || jwtPayload?.email || ''),
            title_th: String(profile?.title_th || jwtDetails?.name_prefix || ''),
            hcode: String(org?.hcode || ''),
            hname: String(org?.hname_th || org?.hname_eng || ''),
            status: 'pending' // Default for new users
        };

        console.log("MOPH Auth: Syncing to Database...");
        // Database Sync (Upsert)
        const [existingUsers]: any = await pool.query(
            'SELECT id, status FROM users WHERE provider_id = ? OR username = ? LIMIT 1', 
            [userData.provider_id, userData.username]
        );
        
        let finalStatus = userData.status;
        let userId;

        if (existingUsers.length > 0) {
            const existingUser = existingUsers[0];
            userId = existingUser.id;
            finalStatus = existingUser.status;
            
            await pool.query(
                `UPDATE users SET 
                username = ?, name_th = ?, name_eng = ?, email = ?, 
                title_th = ?, hcode = ?, hname = ?, hash_cid = ?
                WHERE id = ?`,
                [userData.username, userData.name_th, userData.name_eng, userData.email, userData.title_th, userData.hcode, userData.hname, userData.hash_cid, userId]
            );
        } else {
            const [result]: any = await pool.query(
                `INSERT INTO users (username, provider_id, hash_cid, name_th, name_eng, email, title_th, hcode, hname, status)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
                [userData.username, userData.provider_id, userData.hash_cid, userData.name_th, userData.name_eng, userData.email, userData.title_th, userData.hcode, userData.hname, userData.status]
            );
            userId = result.insertId;
        }

        console.log("MOPH Auth: Generating Session...");
        // Generate Session Token
        const sessionToken = await signJWT({ 
            id: userId, 
            username: userData.username, 
            status: finalStatus,
            name: userData.name_th,
            hname: userData.hname
        });
        
        console.log("MOPH Auth: Redirecting...");
        // Redirect based on status
        const destination = finalStatus === 'active' ? '/telemedicine/admin' : '/telemedicine/login/pending';
        const response = NextResponse.redirect(new URL(destination, request.url));

        // Set Cookie
        response.cookies.set('token', sessionToken, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'strict',
            maxAge: 60 * 60 * 24, // 1 day
            path: '/',
        });

        return response;

    } catch (error: any) {
        console.error("MOPH Auth CRITICAL Error:");
        console.error(error.stack || error);
        // Redirect back to login with error message
        const loginUrl = new URL('/telemedicine/login', request.url);
        loginUrl.searchParams.set('error', 'auth_failed');
        loginUrl.searchParams.set('message', error.message || "Unknown Error");
        return NextResponse.redirect(loginUrl);
    }
}
