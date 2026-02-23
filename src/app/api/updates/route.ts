import { NextRequest, NextResponse } from 'next/server';
import pool from '@/lib/db';

export async function GET() {
    try {
        const query = `
            SELECT update_id, update_date, update_description, update_version, update_created 
            FROM siteupdate 
            ORDER BY update_date DESC, update_created DESC
        `;
        const [rows]: any = await pool.query(query);
        return NextResponse.json(rows);
    } catch (error: any) {
        console.error('Error fetching updates:', error);
        return NextResponse.json({ error: 'Failed to fetch updates' }, { status: 500 });
    }
}

export async function POST(request: NextRequest) {
    try {
        // Authenticate request
        const token = request.cookies.get('token')?.value;
        if (!token) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }
        const { verifyJWT } = await import('@/lib/auth');
        const payload = await verifyJWT(token);
        if (!payload) {
            return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
        }

        const body = await request.json();
        const { date, description, version } = body;

        if (!date || !description) {
            return NextResponse.json({ error: 'Date and description are required' }, { status: 400 });
        }

        const query = `
            INSERT INTO siteupdate (update_date, update_description, update_version)
            VALUES (?, ?, ?)
        `;

        const [result]: any = await pool.query(query, [date, description, version || null]);

        return NextResponse.json({
            success: true,
            message: 'Update added successfully',
            id: result.insertId
        });
    } catch (error: any) {
        console.error('Error adding update:', error);
        return NextResponse.json({ error: 'Failed to add update' }, { status: 500 });
    }
}

export async function DELETE(request: NextRequest) {
    try {
        // Authenticate request
        const token = request.cookies.get('token')?.value;
        if (!token) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }
        const { verifyJWT } = await import('@/lib/auth');
        const payload = await verifyJWT(token);
        if (!payload) {
            return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
        }

        const { searchParams } = new URL(request.url);
        const id = searchParams.get('id');

        if (!id) {
            return NextResponse.json({ error: 'Update ID is required' }, { status: 400 });
        }

        const query = 'DELETE FROM siteupdate WHERE update_id = ?';
        const [result]: any = await pool.query(query, [id]);

        if (result.affectedRows === 0) {
            return NextResponse.json({ error: 'Update not found' }, { status: 404 });
        }

        return NextResponse.json({ success: true, message: 'Update deleted successfully' });
    } catch (error: any) {
        console.error('Error deleting update:', error);
        return NextResponse.json({ error: 'Failed to delete update' }, { status: 500 });
    }
}
