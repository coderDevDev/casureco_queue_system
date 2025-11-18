import { createClient } from '@/lib/supabase/client';

export interface DailySummary {
  date: string;
  total_tickets: number;
  completed: number;
  cancelled: number;
  skipped: number;
  avg_service_time: number;
  avg_wait_time: number;
  service_name?: string;
}

export interface StaffPerformance {
  staff_id: string;
  staff_name: string;
  counter_name: string;
  date: string;
  tickets_served: number;
  completed: number;
  avg_service_time: number;
  tickets_transferred_out: number;
  tickets_transferred_in: number;
}

export interface HourlyTraffic {
  day_of_week: number;
  hour: number;
  ticket_count: number;
  avg_wait_time: number;
}

export interface WeeklySummary {
  week_start: string;
  total_tickets: number;
  completed: number;
  avg_wait_time: number;
  peak_day: string;
}

/**
 * Get daily summary for a date range
 */
export async function getDailySummary(
  branchId: string,
  startDate: Date,
  endDate: Date
): Promise<DailySummary[]> {
  const supabase = createClient();

  try {
    const { data: tickets, error } = await supabase
      .from('tickets')
      .select(`
        id,
        status,
        created_at,
        started_at,
        ended_at,
        called_at,
        service:services(name)
      `)
      .eq('branch_id', branchId)
      .gte('created_at', startDate.toISOString())
      .lte('created_at', endDate.toISOString())
      .order('created_at', { ascending: true });

    if (error) throw error;

    // Group by date
    const summaryMap = new Map<string, DailySummary>();

    tickets?.forEach((ticket: any) => {
      const date = new Date(ticket.created_at).toISOString().split('T')[0];
      
      if (!summaryMap.has(date)) {
        summaryMap.set(date, {
          date,
          total_tickets: 0,
          completed: 0,
          cancelled: 0,
          skipped: 0,
          avg_service_time: 0,
          avg_wait_time: 0,
        });
      }

      const summary = summaryMap.get(date)!;
      summary.total_tickets++;

      if (ticket.status === 'done') summary.completed++;
      if (ticket.status === 'cancelled') summary.cancelled++;
      if (ticket.status === 'skipped') summary.skipped++;

      // Calculate service time
      if (ticket.started_at && ticket.ended_at) {
        const serviceTime = 
          (new Date(ticket.ended_at).getTime() - new Date(ticket.started_at).getTime()) / 1000;
        summary.avg_service_time = 
          (summary.avg_service_time * (summary.completed - 1) + serviceTime) / summary.completed;
      }

      // Calculate wait time
      if (ticket.created_at && ticket.called_at) {
        const waitTime = 
          (new Date(ticket.called_at).getTime() - new Date(ticket.created_at).getTime()) / 1000;
        summary.avg_wait_time = 
          (summary.avg_wait_time * (summary.total_tickets - 1) + waitTime) / summary.total_tickets;
      }
    });

    return Array.from(summaryMap.values());
  } catch (error) {
    console.error('Error fetching daily summary:', error);
    return [];
  }
}

/**
 * Get weekly summary
 */
export async function getWeeklySummary(
  branchId: string,
  startDate: Date,
  endDate: Date
): Promise<WeeklySummary[]> {
  const dailySummaries = await getDailySummary(branchId, startDate, endDate);
  
  // Group by week
  const weeklyMap = new Map<string, WeeklySummary>();

  dailySummaries.forEach((daily) => {
    const date = new Date(daily.date);
    const weekStart = new Date(date);
    weekStart.setDate(date.getDate() - date.getDay()); // Start of week (Sunday)
    const weekKey = weekStart.toISOString().split('T')[0];

    if (!weeklyMap.has(weekKey)) {
      weeklyMap.set(weekKey, {
        week_start: weekKey,
        total_tickets: 0,
        completed: 0,
        avg_wait_time: 0,
        peak_day: '',
      });
    }

    const weekly = weeklyMap.get(weekKey)!;
    weekly.total_tickets += daily.total_tickets;
    weekly.completed += daily.completed;
    weekly.avg_wait_time = 
      (weekly.avg_wait_time + daily.avg_wait_time) / 2;
  });

  return Array.from(weeklyMap.values());
}

/**
 * Get staff performance metrics
 */
export async function getStaffPerformance(
  branchId: string,
  startDate: Date,
  endDate: Date
): Promise<StaffPerformance[]> {
  const supabase = createClient();

  try {
    const { data: tickets, error } = await supabase
      .from('tickets')
      .select(`
        id,
        status,
        created_at,
        started_at,
        ended_at,
        transferred_from_counter_id,
        preferred_counter_id,
        counter:counters!tickets_counter_id_fkey(
          id,
          name,
          staff:users!counters_staff_id_fkey(id, name)
        )
      `)
      .eq('branch_id', branchId)
      .gte('created_at', startDate.toISOString())
      .lte('created_at', endDate.toISOString())
      .not('counter_id', 'is', null);

    if (error) throw error;

    // Group by staff and date
    const performanceMap = new Map<string, StaffPerformance>();

    tickets?.forEach((ticket: any) => {
      if (!ticket.counter?.staff) return;

      const date = new Date(ticket.created_at).toISOString().split('T')[0];
      const key = `${ticket.counter.staff.id}-${date}`;

      if (!performanceMap.has(key)) {
        performanceMap.set(key, {
          staff_id: ticket.counter.staff.id,
          staff_name: ticket.counter.staff.name,
          counter_name: ticket.counter.name,
          date,
          tickets_served: 0,
          completed: 0,
          avg_service_time: 0,
          tickets_transferred_out: 0,
          tickets_transferred_in: 0,
        });
      }

      const perf = performanceMap.get(key)!;
      perf.tickets_served++;

      if (ticket.status === 'done') perf.completed++;

      // Service time
      if (ticket.started_at && ticket.ended_at) {
        const serviceTime = 
          (new Date(ticket.ended_at).getTime() - new Date(ticket.started_at).getTime()) / 1000;
        perf.avg_service_time = 
          (perf.avg_service_time * (perf.completed - 1) + serviceTime) / perf.completed;
      }

      // Transfers
      if (ticket.transferred_from_counter_id === ticket.counter.id) {
        perf.tickets_transferred_out++;
      }
      if (ticket.preferred_counter_id === ticket.counter.id) {
        perf.tickets_transferred_in++;
      }
    });

    return Array.from(performanceMap.values());
  } catch (error) {
    console.error('Error fetching staff performance:', error);
    return [];
  }
}

/**
 * Get hourly traffic for heatmap
 */
export async function getHourlyTraffic(
  branchId: string,
  startDate: Date,
  endDate: Date
): Promise<HourlyTraffic[]> {
  const supabase = createClient();

  try {
    const { data: tickets, error } = await supabase
      .from('tickets')
      .select('id, created_at, called_at')
      .eq('branch_id', branchId)
      .gte('created_at', startDate.toISOString())
      .lte('created_at', endDate.toISOString());

    if (error) throw error;

    // Group by day of week and hour
    const trafficMap = new Map<string, HourlyTraffic>();

    tickets?.forEach((ticket) => {
      const date = new Date(ticket.created_at);
      const dayOfWeek = date.getDay(); // 0 = Sunday
      const hour = date.getHours();
      const key = `${dayOfWeek}-${hour}`;

      if (!trafficMap.has(key)) {
        trafficMap.set(key, {
          day_of_week: dayOfWeek,
          hour,
          ticket_count: 0,
          avg_wait_time: 0,
        });
      }

      const traffic = trafficMap.get(key)!;
      traffic.ticket_count++;

      // Calculate wait time
      if (ticket.called_at) {
        const waitTime = 
          (new Date(ticket.called_at).getTime() - date.getTime()) / 1000;
        traffic.avg_wait_time = 
          (traffic.avg_wait_time * (traffic.ticket_count - 1) + waitTime) / traffic.ticket_count;
      }
    });

    return Array.from(trafficMap.values());
  } catch (error) {
    console.error('Error fetching hourly traffic:', error);
    return [];
  }
}

/**
 * Export data to CSV format
 */
export function exportToCSV(data: any[], filename: string) {
  const headers = Object.keys(data[0] || {});
  const csvContent = [
    headers.join(','),
    ...data.map(row => 
      headers.map(header => JSON.stringify(row[header] ?? '')).join(',')
    )
  ].join('\n');

  const blob = new Blob([csvContent], { type: 'text/csv' });
  const url = window.URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `${filename}-${new Date().toISOString().split('T')[0]}.csv`;
  link.click();
  window.URL.revokeObjectURL(url);
}