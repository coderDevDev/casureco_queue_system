import { NextResponse } from 'next/server';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

/**
 * API Route: Printer Status
 * Check if Gprinter GP-1424D is connected and ready using Windows commands
 */

export async function GET() {
  try {
    // Check if printer is available
    const printerConnected = await checkPrinterConnection();

    return NextResponse.json({
      connected: printerConnected,
      printerName: 'Gprinter GP-1424D',
      status: printerConnected ? 'ready' : 'offline'
    });
  } catch (error) {
    console.error('Printer status check error:', error);
    return NextResponse.json({
      connected: false,
      status: 'error',
      error: 'Failed to check printer status'
    }, { status: 500 });
  }
}

async function checkPrinterConnection(): Promise<boolean> {
  try {
    // Use PowerShell to check if printer exists
    const command = `powershell -Command "Get-Printer | Where-Object {$_.Name -like '*Gprinter*' -or $_.Name -like '*GP-1424D*'} | Select-Object -First 1"`;
    
    const { stdout } = await execAsync(command);
    
    // If output contains printer info, it's connected
    return stdout.trim().length > 0;
  } catch (error) {
    console.error('Error checking printer:', error);
    return false;
  }
}
