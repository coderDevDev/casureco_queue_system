import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { format } from 'date-fns';
import { DailySummary, StaffPerformance, HourlyTraffic } from './reports-service';
import { formatDuration } from '@/lib/utils';

interface BrandingInfo {
  company_name: string;
  logo_url?: string;
}

// CSV Export Functions
export function exportDailySummaryToCSV(data: DailySummary[], filename: string = 'daily-summary') {
  const headers = ['Date', 'Total Tickets', 'Completed', 'Cancelled', 'Skipped', 'Avg Wait Time', 'Avg Service Time'];
  
  const rows = data.map(row => [
    format(new Date(row.date), 'yyyy-MM-dd'),
    row.total_tickets,
    row.completed,
    row.cancelled,
    row.skipped,
    formatDuration(row.avg_wait_time),
    formatDuration(row.avg_service_time),
  ]);

  downloadCSV(headers, rows, filename);
}

export function exportStaffPerformanceToCSV(data: StaffPerformance[], filename: string = 'staff-performance') {
  const headers = [
    'Staff Name',
    'Counter',
    'Tickets Served',
    'Completed',
    'Completion Rate (%)',
    'Avg Service Time',
    'Transferred Out',
    'Transferred In'
  ];

  // Aggregate by staff
  const aggregated = Object.values(
    data.reduce((acc, perf) => {
      if (!acc[perf.staff_id]) {
        acc[perf.staff_id] = {
          staff_name: perf.staff_name,
          counter_name: perf.counter_name,
          tickets_served: 0,
          completed: 0,
          avg_service_time: 0,
          tickets_transferred_out: 0,
          tickets_transferred_in: 0,
          count: 0,
        };
      }
      acc[perf.staff_id].tickets_served += perf.tickets_served;
      acc[perf.staff_id].completed += perf.completed;
      acc[perf.staff_id].avg_service_time += perf.avg_service_time;
      acc[perf.staff_id].tickets_transferred_out += perf.tickets_transferred_out;
      acc[perf.staff_id].tickets_transferred_in += perf.tickets_transferred_in;
      acc[perf.staff_id].count++;
      return acc;
    }, {} as any)
  );

  const rows = aggregated.map((staff: any) => {
    const avgServiceTime = staff.avg_service_time / staff.count;
    const completionRate = staff.tickets_served > 0 
      ? ((staff.completed / staff.tickets_served) * 100).toFixed(1)
      : '0.0';

    return [
      staff.staff_name,
      staff.counter_name,
      staff.tickets_served,
      staff.completed,
      completionRate,
      formatDuration(Math.round(avgServiceTime)),
      staff.tickets_transferred_out,
      staff.tickets_transferred_in,
    ];
  });

  downloadCSV(headers, rows, filename);
}

export function exportHourlyTrafficToCSV(data: HourlyTraffic[], filename: string = 'hourly-traffic') {
  const headers = ['Day of Week', 'Hour', 'Ticket Count'];
  
  const rows = data.map(row => [
    ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'][row.day_of_week],
    `${row.hour}:00`,
    row.ticket_count,
  ]);

  downloadCSV(headers, rows, filename);
}

function downloadCSV(headers: string[], rows: any[][], filename: string) {
  const csvContent = [
    headers.join(','),
    ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
  ].join('\n');

  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);
  
  link.setAttribute('href', url);
  link.setAttribute('download', `${filename}_${format(new Date(), 'yyyy-MM-dd')}.csv`);
  link.style.visibility = 'hidden';
  
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

// PDF Export Functions
export async function exportDailySummaryToPDF(
  data: DailySummary[],
  branding: BrandingInfo,
  dateRange: { start: Date; end: Date }
) {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.width;
  
  // Add decorative header background
  doc.setFillColor(0, 51, 160); // #0033A0
  doc.rect(0, 0, pageWidth, 45, 'F');
  
  // Add logo if available
  if (branding.logo_url) {
    try {
      await addImageToPDF(doc, branding.logo_url, 14, 8, 25, 25);
    } catch (error) {
      console.error('Error loading logo:', error);
    }
  }

  // Header - Company Name
  doc.setFontSize(22);
  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.text(branding.company_name, 45, 18);
  
  // Report Title
  doc.setFontSize(14);
  doc.setFont('helvetica', 'normal');
  doc.text('Daily Summary Report', 45, 27);
  
  // Date Range
  doc.setFontSize(9);
  doc.setTextColor(220, 220, 220);
  doc.text(
    `Period: ${format(dateRange.start, 'MMM dd, yyyy')} - ${format(dateRange.end, 'MMM dd, yyyy')}`,
    45,
    34
  );

  // Summary Statistics Section
  const totalTickets = data.reduce((sum, day) => sum + day.total_tickets, 0);
  const totalCompleted = data.reduce((sum, day) => sum + day.completed, 0);
  const totalCancelled = data.reduce((sum, day) => sum + day.cancelled, 0);
  const totalSkipped = data.reduce((sum, day) => sum + day.skipped, 0);
  const avgWaitTime = data.reduce((sum, day) => sum + day.avg_wait_time, 0) / (data.length || 1);
  const avgServiceTime = data.reduce((sum, day) => sum + day.avg_service_time, 0) / (data.length || 1);
  const completionRate = totalTickets > 0 ? ((totalCompleted / totalTickets) * 100).toFixed(1) : '0.0';

  // Statistics Cards
  const startY = 55;
  const cardWidth = (pageWidth - 40) / 4;
  const cardHeight = 28;
  const cards = [
    { label: 'Total Tickets', value: totalTickets.toLocaleString(), color: [59, 130, 246] },
    { label: 'Completed', value: totalCompleted.toLocaleString(), color: [16, 185, 129] },
    { label: 'Completion Rate', value: `${completionRate}%`, color: [139, 92, 246] },
    { label: 'Avg Wait Time', value: formatDuration(Math.round(avgWaitTime)), color: [251, 146, 60] },
  ];

  cards.forEach((card, index) => {
    const x = 14 + (index * (cardWidth + 3));
    
    // Card background
    doc.setFillColor(248, 250, 252);
    doc.roundedRect(x, startY, cardWidth, cardHeight, 2, 2, 'F');
    
    // Colored top border
    doc.setFillColor(card.color[0], card.color[1], card.color[2]);
    doc.rect(x, startY, cardWidth, 3, 'F');
    
    // Value
    doc.setFontSize(16);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(30, 41, 59);
    doc.text(card.value, x + cardWidth / 2, startY + 14, { align: 'center' });
    
    // Label
    doc.setFontSize(8);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(100, 116, 139);
    doc.text(card.label, x + cardWidth / 2, startY + 22, { align: 'center' });
  });

  // Additional Statistics
  const additionalY = startY + cardHeight + 10;
  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(30, 41, 59);
  doc.text('Detailed Breakdown', 14, additionalY);
  
  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(71, 85, 105);
  doc.text(`Cancelled: ${totalCancelled}`, 14, additionalY + 7);
  doc.text(`Skipped: ${totalSkipped}`, 14, additionalY + 14);
  doc.text(`Avg Service Time: ${formatDuration(Math.round(avgServiceTime))}`, 14, additionalY + 21);

  // Daily Data Table
  autoTable(doc, {
    startY: additionalY + 28,
    head: [['Date', 'Total', 'Completed', 'Cancelled', 'Skipped', 'Avg Wait', 'Avg Service']],
    body: data.map(row => [
      format(new Date(row.date), 'MMM dd, yyyy'),
      row.total_tickets,
      row.completed,
      row.cancelled,
      row.skipped,
      formatDuration(row.avg_wait_time),
      formatDuration(row.avg_service_time),
    ]),
    theme: 'striped',
    headStyles: { 
      fillColor: [0, 51, 160],
      textColor: 255,
      fontSize: 9,
      fontStyle: 'bold',
      halign: 'center'
    },
    styles: { 
      fontSize: 8,
      cellPadding: 3,
      halign: 'center'
    },
    alternateRowStyles: {
      fillColor: [248, 250, 252]
    },
    columnStyles: {
      0: { halign: 'left', cellWidth: 35 },
    },
  });

  // Footer with branding
  const pageCount = doc.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    
    // Footer line
    doc.setDrawColor(226, 232, 240);
    doc.setLineWidth(0.5);
    doc.line(14, doc.internal.pageSize.height - 20, pageWidth - 14, doc.internal.pageSize.height - 20);
    
    // Footer text
    doc.setFontSize(8);
    doc.setTextColor(148, 163, 184);
    doc.setFont('helvetica', 'normal');
    doc.text(
      branding.company_name,
      14,
      doc.internal.pageSize.height - 12
    );
    doc.text(
      `Generated on ${format(new Date(), 'MMM dd, yyyy HH:mm')}`,
      pageWidth / 2,
      doc.internal.pageSize.height - 12,
      { align: 'center' }
    );
    doc.text(
      `Page ${i} of ${pageCount}`,
      pageWidth - 14,
      doc.internal.pageSize.height - 12,
      { align: 'right' }
    );
  }

  doc.save(`${branding.company_name.replace(/\s+/g, '_')}_Daily_Summary_${format(new Date(), 'yyyy-MM-dd')}.pdf`);
}

export async function exportStaffPerformanceToPDF(
  data: StaffPerformance[],
  branding: BrandingInfo,
  dateRange: { start: Date; end: Date }
) {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.width;
  
  // Add decorative header background
  doc.setFillColor(0, 51, 160); // #0033A0
  doc.rect(0, 0, pageWidth, 45, 'F');
  
  // Add logo if available
  if (branding.logo_url) {
    try {
      await addImageToPDF(doc, branding.logo_url, 14, 8, 25, 25);
    } catch (error) {
      console.error('Error loading logo:', error);
    }
  }

  // Header - Company Name
  doc.setFontSize(22);
  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.text(branding.company_name, 45, 18);
  
  // Report Title
  doc.setFontSize(14);
  doc.setFont('helvetica', 'normal');
  doc.text('Staff Performance Report', 45, 27);
  
  // Date Range
  doc.setFontSize(9);
  doc.setTextColor(220, 220, 220);
  doc.text(
    `Period: ${format(dateRange.start, 'MMM dd, yyyy')} - ${format(dateRange.end, 'MMM dd, yyyy')}`,
    45,
    34
  );

  // Aggregate staff data
  const aggregated = Object.values(
    data.reduce((acc, perf) => {
      if (!acc[perf.staff_id]) {
        acc[perf.staff_id] = {
          staff_name: perf.staff_name,
          counter_name: perf.counter_name,
          tickets_served: 0,
          completed: 0,
          avg_service_time: 0,
          tickets_transferred_out: 0,
          tickets_transferred_in: 0,
          count: 0,
        };
      }
      acc[perf.staff_id].tickets_served += perf.tickets_served;
      acc[perf.staff_id].completed += perf.completed;
      acc[perf.staff_id].avg_service_time += perf.avg_service_time;
      acc[perf.staff_id].tickets_transferred_out += perf.tickets_transferred_out;
      acc[perf.staff_id].tickets_transferred_in += perf.tickets_transferred_in;
      acc[perf.staff_id].count++;
      return acc;
    }, {} as any)
  );

  // Summary Statistics
  const totalStaff = aggregated.length;
  const totalTickets = aggregated.reduce((sum: number, s: any) => sum + s.tickets_served, 0);
  const totalCompleted = aggregated.reduce((sum: number, s: any) => sum + s.completed, 0);
  const totalTransfers = aggregated.reduce((sum: number, s: any) => sum + s.tickets_transferred_out, 0);
  const avgTicketsPerStaff = totalStaff > 0 ? Math.round(totalTickets / totalStaff) : 0;

  // Statistics Cards
  const startY = 55;
  const cardWidth = (pageWidth - 40) / 4;
  const cardHeight = 28;
  const cards = [
    { label: 'Total Staff', value: totalStaff.toString(), color: [139, 92, 246] },
    { label: 'Total Tickets', value: totalTickets.toLocaleString(), color: [59, 130, 246] },
    { label: 'Completed', value: totalCompleted.toLocaleString(), color: [16, 185, 129] },
    { label: 'Avg/Staff', value: avgTicketsPerStaff.toString(), color: [251, 146, 60] },
  ];

  cards.forEach((card, index) => {
    const x = 14 + (index * (cardWidth + 3));
    
    // Card background
    doc.setFillColor(248, 250, 252);
    doc.roundedRect(x, startY, cardWidth, cardHeight, 2, 2, 'F');
    
    // Colored top border
    doc.setFillColor(card.color[0], card.color[1], card.color[2]);
    doc.rect(x, startY, cardWidth, 3, 'F');
    
    // Value
    doc.setFontSize(16);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(30, 41, 59);
    doc.text(card.value, x + cardWidth / 2, startY + 14, { align: 'center' });
    
    // Label
    doc.setFontSize(8);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(100, 116, 139);
    doc.text(card.label, x + cardWidth / 2, startY + 22, { align: 'center' });
  });

  // Additional Statistics
  const additionalY = startY + cardHeight + 10;
  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(30, 41, 59);
  doc.text('Performance Overview', 14, additionalY);
  
  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(71, 85, 105);
  doc.text(`Total Transfers: ${totalTransfers}`, 14, additionalY + 7);
  doc.text(`Completion Rate: ${totalTickets > 0 ? ((totalCompleted / totalTickets) * 100).toFixed(1) : '0.0'}%`, 14, additionalY + 14);

  // Staff Performance Table
  autoTable(doc, {
    startY: additionalY + 22,
    head: [['Staff', 'Counter', 'Served', 'Completed', 'Rate %', 'Avg Time', 'Out', 'In']],
    body: aggregated
      .sort((a: any, b: any) => b.tickets_served - a.tickets_served)
      .map((staff: any) => {
        const avgServiceTime = staff.avg_service_time / staff.count;
        const completionRate = staff.tickets_served > 0 
          ? ((staff.completed / staff.tickets_served) * 100).toFixed(1)
          : '0.0';

        return [
          staff.staff_name,
          staff.counter_name,
          staff.tickets_served,
          staff.completed,
          completionRate,
          formatDuration(Math.round(avgServiceTime)),
          staff.tickets_transferred_out,
          staff.tickets_transferred_in,
        ];
      }),
    theme: 'striped',
    headStyles: { 
      fillColor: [0, 51, 160],
      textColor: 255,
      fontSize: 9,
      fontStyle: 'bold',
      halign: 'center'
    },
    styles: { 
      fontSize: 8,
      cellPadding: 3,
      halign: 'center'
    },
    alternateRowStyles: {
      fillColor: [248, 250, 252]
    },
    columnStyles: {
      0: { halign: 'left', cellWidth: 35 },
      1: { halign: 'left', cellWidth: 30 },
    },
  });

  // Footer with branding
  const pageCount = doc.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    
    // Footer line
    doc.setDrawColor(226, 232, 240);
    doc.setLineWidth(0.5);
    doc.line(14, doc.internal.pageSize.height - 20, pageWidth - 14, doc.internal.pageSize.height - 20);
    
    // Footer text
    doc.setFontSize(8);
    doc.setTextColor(148, 163, 184);
    doc.setFont('helvetica', 'normal');
    doc.text(
      branding.company_name,
      14,
      doc.internal.pageSize.height - 12
    );
    doc.text(
      `Generated on ${format(new Date(), 'MMM dd, yyyy HH:mm')}`,
      pageWidth / 2,
      doc.internal.pageSize.height - 12,
      { align: 'center' }
    );
    doc.text(
      `Page ${i} of ${pageCount}`,
      pageWidth - 14,
      doc.internal.pageSize.height - 12,
      { align: 'right' }
    );
  }

  doc.save(`${branding.company_name.replace(/\s+/g, '_')}_Staff_Performance_${format(new Date(), 'yyyy-MM-dd')}.pdf`);
}

// Helper function to add image to PDF
async function addImageToPDF(
  doc: jsPDF,
  imageUrl: string,
  x: number,
  y: number,
  width: number,
  height: number
): Promise<void> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    
    img.onload = () => {
      try {
        // Detect image format from URL or try multiple formats
        let format = 'PNG';
        if (imageUrl.toLowerCase().endsWith('.jpg') || imageUrl.toLowerCase().endsWith('.jpeg')) {
          format = 'JPEG';
        } else if (imageUrl.toLowerCase().endsWith('.ico')) {
          // Convert ICO to canvas first for better compatibility
          const canvas = document.createElement('canvas');
          canvas.width = img.width;
          canvas.height = img.height;
          const ctx = canvas.getContext('2d');
          if (ctx) {
            ctx.drawImage(img, 0, 0);
            const dataUrl = canvas.toDataURL('image/png');
            doc.addImage(dataUrl, 'PNG', x, y, width, height);
            resolve();
            return;
          }
        }
        doc.addImage(img, format, x, y, width, height);
        resolve();
      } catch (error) {
        console.error('Error adding image to PDF:', error);
        reject(error);
      }
    };
    
    img.onerror = (error) => {
      console.error('Error loading image:', error);
      reject(error);
    };
    
    img.src = imageUrl;
  });
}
