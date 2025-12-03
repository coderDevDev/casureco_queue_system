import { NextRequest, NextResponse } from 'next/server';
import { exec } from 'child_process';
import { promisify } from 'util';
import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';

const execAsync = promisify(exec);

/**
 * API Route: Print Ticket
 * Handles direct printing to Gprinter GP-1424D thermal printer
 * 
 * Uses Windows printing via PowerShell for compatibility
 */

export async function POST(request: NextRequest) {
  try {
    const ticketData = await request.json();

    // Generate print content
    const printContent = generatePrintContent(ticketData);

    // Send to printer via Windows
    const printSuccess = await sendToPrinterWindows(printContent, ticketData);

    if (printSuccess) {
      return NextResponse.json({ success: true, message: 'Ticket printed successfully' });
    } else {
      return NextResponse.json({ success: false, message: 'Failed to print ticket' }, { status: 500 });
    }
  } catch (error) {
    console.error('Print error:', error);
    return NextResponse.json({ success: false, message: 'Print error occurred' }, { status: 500 });
  }
}

/**
 * Generate ESC/POS commands for thermal printer
 */
function generateESCPOSCommands(data: any): Buffer {
  const ESC = '\x1B';
  const GS = '\x1D';
  
  let commands = '';
  
  // Initialize printer
  commands += ESC + '@';
  
  // Set alignment to center
  commands += ESC + 'a' + '\x01';
  
  // Print company name (bold, double height)
  commands += ESC + 'E' + '\x01'; // Bold on
  commands += GS + '!' + '\x11'; // Double height and width
  commands += data.companyName + '\n';
  commands += GS + '!' + '\x00'; // Normal size
  commands += ESC + 'E' + '\x00'; // Bold off
  
  // Print date
  commands += data.date + '\n';
  
  // Print separator
  commands += '--------------------------------\n';
  
  // Print "Your Ticket Number"
  commands += '\n';
  commands += 'Your Ticket Number\n';
  
  // Print ticket number (large, bold)
  commands += ESC + 'E' + '\x01'; // Bold on
  commands += GS + '!' + '\x33'; // Triple height and width
  commands += data.ticketNumber + '\n';
  commands += GS + '!' + '\x00'; // Normal size
  commands += ESC + 'E' + '\x00'; // Bold off
  commands += '\n';
  
  // Print separator
  commands += '--------------------------------\n';
  
  // Set alignment to left
  commands += ESC + 'a' + '\x00';
  
  // Print service info
  commands += 'Service:          ' + data.serviceName + '\n';
  commands += 'Queue Position:   ' + data.queuePosition + '\n';
  commands += 'Estimated Wait:   ' + data.estimatedWait + '\n';
  commands += 'Time Issued:      ' + data.timeIssued + '\n';
  
  // Set alignment to center
  commands += ESC + 'a' + '\x01';
  commands += '\n';
  
  // Print footer text
  if (data.headerText) {
    commands += data.headerText + '\n';
  }
  if (data.footerText) {
    commands += data.footerText + '\n';
  }
  
  // Cut paper
  commands += '\n\n\n';
  commands += GS + 'V' + '\x41' + '\x00'; // Partial cut
  
  return Buffer.from(commands, 'binary');
}

/**
 * Generate formatted ticket content for thermal printer
 */
function generatePrintContent(data: any): string {
  const width = 32; // Thermal printer typical width (32 characters)
  let content = '';
  
  // Helper function to center text
  const center = (text: string) => {
    const padding = Math.max(0, Math.floor((width - text.length) / 2));
    return ' '.repeat(padding) + text;
  };
  
  // Helper function for dashed line
  const dashedLine = () => '- '.repeat(width / 2).trim();
  
  // Top border
  content += '='.repeat(width) + '\n';
  
  // Company Name (centered, bold)
  content += center(data.companyName.toUpperCase()) + '\n';
  content += center(data.date) + '\n';
  
  // Dashed separator
  content += dashedLine() + '\n\n';
  
  // "Your Ticket Number" label (centered)
  content += center('Your Ticket Number') + '\n\n';
  
  // Ticket Number (centered, large)
  const ticketNum = data.ticketNumber;
  content += center(ticketNum) + '\n';
  content += center('═'.repeat(ticketNum.length)) + '\n\n';
  
  // Dashed separator
  content += dashedLine() + '\n\n';
  
  // Service Information (left-aligned with spacing)
  const addInfo = (label: string, value: string) => {
    const labelPadded = label.padEnd(18, ' ');
    content += labelPadded + value + '\n';
  };
  
  addInfo('Service:', data.serviceName);
  addInfo('Queue Position:', data.queuePosition.toString());
  addInfo('Estimated Wait:', data.estimatedWait);
  addInfo('Time Issued:', data.timeIssued);
  
  content += '\n';
  
  // Footer messages (centered)
  if (data.headerText) {
    content += center(data.headerText) + '\n';
  }
  if (data.footerText) {
    content += center(data.footerText) + '\n';
  }
  
  // Bottom border
  content += '\n' + '='.repeat(width) + '\n';
  
  // Extra spacing for paper cut
  content += '\n\n\n';
  
  return content;
}

/**
 * Send to printer using Windows printing
 */
async function sendToPrinterWindows(content: string, data: any): Promise<boolean> {
  try {
    // Create temporary file
    const tempDir = os.tmpdir();
    const tempFile = path.join(tempDir, `ticket_${Date.now()}.txt`);
    
    fs.writeFileSync(tempFile, content, 'utf8');
    
    // Print using Windows command
    // This will use the default printer or you can specify printer name
    const printerName = 'Gprinter GP-1424D';
    
    // PowerShell command to print
    const command = `powershell -Command "Get-Content '${tempFile}' | Out-Printer -Name '${printerName}'"`;
    
    await execAsync(command);
    
    // Clean up temp file
    setTimeout(() => {
      try {
        fs.unlinkSync(tempFile);
      } catch (e) {
        console.error('Failed to delete temp file:', e);
      }
    }, 5000);
    
    return true;
  } catch (error) {
    console.error('Failed to print via Windows:', error);
    return false;
  }
}
