import { NextRequest, NextResponse } from 'next/server';
import { exec } from 'child_process';
import { promisify } from 'util';
import path from 'path';

const execPromise = promisify(exec);

export async function POST(request: NextRequest) {
    try {
        // You might want to add authentication here
        // const token = request.cookies.get('token')?.value;
        // if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

        const scriptPath = path.join(process.cwd(), 'scripts', 'sync_telemed_hdc.py');
        
        console.log(`Starting HDC Sync script: ${scriptPath}`);
        
        // Execute the python script using uv run
        const { stdout, stderr } = await execPromise(`uv run python "${scriptPath}"`);
        
        if (stderr && !stdout) {
            console.error('Script stderr:', stderr);
            return NextResponse.json({ 
                success: false, 
                error: stderr,
                message: 'Script encountered an error'
            }, { status: 500 });
        }

        console.log('Script stdout:', stdout);

        return NextResponse.json({
            success: true,
            message: 'Sync completed successfully',
            output: stdout
        });

    } catch (error: any) {
        console.error('Sync execution error:', error);
        return NextResponse.json({ 
            success: false, 
            error: error.message,
            message: 'Failed to execute sync script'
        }, { status: 500 });
    }
}
