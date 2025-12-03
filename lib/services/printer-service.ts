/**
 * Printer Service - Direct printing to thermal printer
 * Sends print jobs to backend API that communicates with Gprinter GP-1424D
 */

interface PrintTicketData {
  ticketNumber: string;
  companyName: string;
  serviceName: string;
  queuePosition: number;
  estimatedWait: string;
  timeIssued: string;
  date: string;
  headerText?: string;
  footerText?: string;
  logoUrl?: string;
  borderColor?: string;
  primaryColor?: string;
}

/**
 * Send ticket data to printer API for direct printing
 */
export async function printTicketDirect(ticketData: PrintTicketData): Promise<boolean> {
  try {
    const response = await fetch('/api/print-ticket', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(ticketData),
    });

    if (!response.ok) {
      throw new Error('Print request failed');
    }

    const result = await response.json();
    return result.success;
  } catch (error) {
    console.error('Failed to print ticket:', error);
    return false;
  }
}

/**
 * Check if printer is connected and ready
 */
export async function checkPrinterStatus(): Promise<boolean> {
  try {
    const response = await fetch('/api/printer-status');
    const result = await response.json();
    return result.connected;
  } catch (error) {
    console.error('Failed to check printer status:', error);
    return false;
  }
}
