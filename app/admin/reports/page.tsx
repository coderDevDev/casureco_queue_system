'use client';

import { useState, useEffect } from 'react';
import { Download, FileText, BarChart3, Users, Clock, TrendingUp } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { LineChart, Line, BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { getDailySummary, getStaffPerformance, getHourlyTraffic, DailySummary, StaffPerformance, HourlyTraffic } from '@/lib/services/reports-service';
import { 
  exportDailySummaryToCSV, 
  exportStaffPerformanceToCSV, 
  exportHourlyTrafficToCSV,
  exportDailySummaryToPDF,
  exportStaffPerformanceToPDF
} from '@/lib/services/export-service';
import { useAuth } from '@/lib/hooks/use-auth';
import { useBranding } from '@/lib/hooks/use-branding';
import { formatDuration } from '@/lib/utils';
import { BusyHoursHeatmap } from '@/components/admin/reports/busy-hours-heatmap';
import { DateRangePicker } from '@/components/admin/reports/date-range-picker';
import { toast } from 'sonner';

const COLORS = {
  completed: '#10B981',
  cancelled: '#EF4444',
  skipped: '#F59E0B',
  waiting: '#3B82F6',
};

export default function ReportsPage() {
  const { profile } = useAuth();
  const { branding } = useBranding();
  const [dateRange, setDateRange] = useState({
    start: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), // Last 7 days
    end: new Date(),
  });
  const [dailySummary, setDailySummary] = useState<DailySummary[]>([]);
  const [staffPerformance, setStaffPerformance] = useState<StaffPerformance[]>([]);
  const [hourlyTraffic, setHourlyTraffic] = useState<HourlyTraffic[]>([]);
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState(false);

  // Fetch data on mount and when date range changes
  useEffect(() => {
    if (profile?.branch_id) {
      fetchReportData();
    }
  }, [profile?.branch_id, dateRange]);

  async function fetchReportData() {
    if (!profile?.branch_id) return;

    setLoading(true);
    try {
      const [daily, staff, traffic] = await Promise.all([
        getDailySummary(profile.branch_id, dateRange.start, dateRange.end),
        getStaffPerformance(profile.branch_id, dateRange.start, dateRange.end),
        getHourlyTraffic(profile.branch_id, dateRange.start, dateRange.end),
      ]);

      setDailySummary(daily);
      setStaffPerformance(staff);
      setHourlyTraffic(traffic);
    } catch (error) {
      console.error('Error fetching report data:', error);
      toast.error('Failed to load report data');
    } finally {
      setLoading(false);
    }
  }

  // Calculate totals for quick stats
  const totalTickets = dailySummary.reduce((sum, day) => sum + day.total_tickets, 0);
  const totalCompleted = dailySummary.reduce((sum, day) => sum + day.completed, 0);
  const avgWaitTime = dailySummary.reduce((sum, day) => sum + day.avg_wait_time, 0) / (dailySummary.length || 1);
  const avgServiceTime = dailySummary.reduce((sum, day) => sum + day.avg_service_time, 0) / (dailySummary.length || 1);
  const completionRate = totalTickets > 0 ? (totalCompleted / totalTickets) * 100 : 0;
  const activeStaff = new Set(staffPerformance.map(s => s.staff_id)).size;

  // Prepare pie chart data
  const statusData = dailySummary.reduce(
    (acc, day) => {
      acc.completed += day.completed;
      acc.cancelled += day.cancelled;
      acc.skipped += day.skipped;
      return acc;
    },
    { completed: 0, cancelled: 0, skipped: 0 }
  );

  const pieData = [
    { name: 'Completed', value: statusData.completed, color: COLORS.completed },
    { name: 'Cancelled', value: statusData.cancelled, color: COLORS.cancelled },
    { name: 'Skipped', value: statusData.skipped, color: COLORS.skipped },
  ];

  // Export handlers
  async function handleExportDailyCSV() {
    try {
      setExporting(true);
      exportDailySummaryToCSV(dailySummary);
      toast.success('Daily summary exported to CSV');
    } catch (error) {
      toast.error('Failed to export CSV');
    } finally {
      setExporting(false);
    }
  }

  async function handleExportStaffCSV() {
    try {
      setExporting(true);
      exportStaffPerformanceToCSV(staffPerformance);
      toast.success('Staff performance exported to CSV');
    } catch (error) {
      toast.error('Failed to export CSV');
    } finally {
      setExporting(false);
    }
  }

  async function handleExportHourlyCSV() {
    try {
      setExporting(true);
      exportHourlyTrafficToCSV(hourlyTraffic);
      toast.success('Hourly traffic exported to CSV');
    } catch (error) {
      toast.error('Failed to export CSV');
    } finally {
      setExporting(false);
    }
  }

  async function handleExportDailyPDF() {
    try {
      setExporting(true);
      await exportDailySummaryToPDF(dailySummary, {
        company_name: branding.company_name,
        logo_url: branding.logo_url,
      }, dateRange);
      toast.success('Daily summary exported to PDF');
    } catch (error) {
      console.error('PDF export error:', error);
      toast.error('Failed to export PDF');
    } finally {
      setExporting(false);
    }
  }

  async function handleExportStaffPDF() {
    try {
      setExporting(true);
      await exportStaffPerformanceToPDF(staffPerformance, {
        company_name: branding.company_name,
        logo_url: branding.logo_url,
      }, dateRange);
      toast.success('Staff performance exported to PDF');
    } catch (error) {
      console.error('PDF export error:', error);
      toast.error('Failed to export PDF');
    } finally {
      setExporting(false);
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50 p-2">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-4xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent">
              Reports & Analytics
            </h1>
            <p className="text-gray-600 mt-2">
              Comprehensive insights into queue performance and staff metrics
            </p>
          </div>
          <div className="flex gap-3">
            <DateRangePicker 
              dateRange={dateRange}
              onDateRangeChange={setDateRange}
            />
          </div>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {/* Total Tickets Card */}
        <Card className="group relative overflow-hidden border-0 bg-white shadow-md hover:shadow-xl transition-all duration-400 hover:-translate-y-1 rounded-xl">
          <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-blue-100 from-blue-600 to-transparent" />
          <CardContent className="relative p-4">
            <div className="flex items-start justify-between mb-2">
              <div className="rounded-xl p-2.5 bg-blue-100 transition-all duration-400 group-hover:scale-105 shadow">
                <BarChart3 className="h-5 w-5 text-blue-600" />
              </div>
              <div className="text-right leading-tight">
                <div className="text-3xl font-bold bg-gradient-to-br from-gray-900 to-gray-600 bg-clip-text text-transparent mb-0.5">
                  {totalTickets.toLocaleString()}
                </div>
              </div>
            </div>
            <div>
              <p className="text-xs font-bold text-gray-800">Total Tickets</p>
              <p className="text-[10px] text-gray-500">Last {dailySummary.length} days</p>
            </div>
          </CardContent>
        </Card>

        {/* Avg Wait Time Card */}
        <Card className="group relative overflow-hidden border-0 bg-white shadow-md hover:shadow-xl transition-all duration-400 hover:-translate-y-1 rounded-xl">
          <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-orange-100 from-orange-600 to-transparent" />
          <CardContent className="relative p-4">
            <div className="flex items-start justify-between mb-2">
              <div className="rounded-xl p-2.5 bg-orange-100 transition-all duration-400 group-hover:scale-105 shadow">
                <Clock className="h-5 w-5 text-orange-600" />
              </div>
              <div className="text-right leading-tight">
                <div className="text-3xl font-bold bg-gradient-to-br from-gray-900 to-gray-600 bg-clip-text text-transparent mb-0.5">
                  {formatDuration(Math.round(avgWaitTime))}
                </div>
              </div>
            </div>
            <div>
              <p className="text-xs font-bold text-gray-800">Avg Wait Time</p>
              <p className="text-[10px] text-gray-500">Average wait time</p>
            </div>
          </CardContent>
        </Card>

        {/* Completion Rate Card */}
        <Card className="group relative overflow-hidden border-0 bg-white shadow-md hover:shadow-xl transition-all duration-400 hover:-translate-y-1 rounded-xl">
          <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-green-100 from-green-600 to-transparent" />
          <CardContent className="relative p-4">
            <div className="flex items-start justify-between mb-2">
              <div className="rounded-xl p-2.5 bg-green-100 transition-all duration-400 group-hover:scale-105 shadow">
                <TrendingUp className="h-5 w-5 text-green-600" />
              </div>
              <div className="text-right leading-tight">
                <div className="text-3xl font-bold bg-gradient-to-br from-gray-900 to-gray-600 bg-clip-text text-transparent mb-0.5">
                  {completionRate.toFixed(1)}%
                </div>
              </div>
            </div>
            <div>
              <p className="text-xs font-bold text-gray-800">Completion Rate</p>
              <p className="text-[10px] text-gray-500">{totalCompleted} of {totalTickets} completed</p>
            </div>
          </CardContent>
        </Card>

        {/* Active Staff Card */}
        <Card className="group relative overflow-hidden border-0 bg-white shadow-md hover:shadow-xl transition-all duration-400 hover:-translate-y-1 rounded-xl">
          <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-purple-100 from-purple-600 to-transparent" />
          <CardContent className="relative p-4">
            <div className="flex items-start justify-between mb-2">
              <div className="rounded-xl p-2.5 bg-purple-100 transition-all duration-400 group-hover:scale-105 shadow">
                <Users className="h-5 w-5 text-purple-600" />
              </div>
              <div className="text-right leading-tight">
                <div className="text-3xl font-bold bg-gradient-to-br from-gray-900 to-gray-600 bg-clip-text text-transparent mb-0.5">
                  {activeStaff}
                </div>
              </div>
            </div>
            <div>
              <p className="text-xs font-bold text-gray-800">Active Staff</p>
              <p className="text-[10px] text-gray-500">Active staff members</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tabs for Different Reports */}
      <Tabs defaultValue="daily" className="space-y-6">
      <TabsList className="bg-white/80 backdrop-blur-sm shadow-lg p-1 rounded-2xl border border-blue-100">
  <TabsTrigger 
    value="daily"
    className="
      data-[state=active]:bg-gradient-to-r 
      data-[state=active]:from-[#0052D4] 
      data-[state=active]:via-[#4364F7] 
      data-[state=active]:to-[#6FB1FC]
      data-[state=active]:text-white 
      data-[state=active]:shadow-md 
      rounded-xl px-4 py-2 text-sm font-medium
      transition-all duration-300
      hover:bg-blue-50
    "
  >
    Daily Summary
  </TabsTrigger>

  <TabsTrigger 
    value="staff"
    className="
      data-[state=active]:bg-gradient-to-r 
      data-[state=active]:from-[#0052D4] 
      data-[state=active]:via-[#4364F7] 
      data-[state=active]:to-[#6FB1FC]
      data-[state=active]:text-white 
      data-[state=active]:shadow-md 
      rounded-xl px-4 py-2 text-sm font-medium
      transition-all duration-300
      hover:bg-blue-50
    "
  >
    Staff Performance
  </TabsTrigger>

  <TabsTrigger 
    value="heatmap"
    className="
      data-[state=active]:bg-gradient-to-r 
      data-[state=active]:from-[#0052D4] 
      data-[state=active]:via-[#4364F7] 
      data-[state=active]:to-[#6FB1FC]
      data-[state=active]:text-white 
      data-[state=active]:shadow-md 
      rounded-xl px-4 py-2 text-sm font-medium
      transition-all duration-300
      hover:bg-blue-50
    "
  >
    Busy Hours
  </TabsTrigger>
</TabsList>


        <TabsContent value="daily" className="space-y-6">
          {/* Export Buttons */}
          <div className="flex justify-end gap-3">
            <Button 
              onClick={handleExportDailyCSV} 
              disabled={exporting || loading}
              variant="outline"
              className="
               gap-2 
              text-white
           border-[#0033A0] text-[#0033A0]
              
              
              "
            >
              <Download className="h-4 w-4" />
              Export CSV
            </Button>
            <Button 
              onClick={handleExportDailyPDF} 
              disabled={exporting || loading}
                      variant="outline"
              className="
      gap-2 
              text-white
           border-[#0033A0] text-[#0033A0]
              
              
              "
            >
              <FileText className="h-4 w-4" />
              Export PDF
            </Button>
          </div>

          <div className="grid gap-6 md:grid-cols-2">
            {/* Line Chart - Tickets Over Time */}
            <Card className="bg-white/80 backdrop-blur-xl border border-white/50 shadow-lg overflow-hidden">
              <CardHeader className="border-b border-gray-200 bg-white/50 backdrop-blur-sm pb-4">
                <CardTitle className="text-xl font-bold text-gray-900">Tickets Over Time</CardTitle>
                <p className="text-sm text-gray-500 mt-1">Daily ticket trends and completion rates</p>
              </CardHeader>
              <CardContent className="pt-6">
                {loading ? (
                  <div className="h-[300px] flex items-center justify-center">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#0033A0]"></div>
                  </div>
                ) : (
                  <ResponsiveContainer width="100%" height={300}>
                    <LineChart data={dailySummary}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                      <XAxis 
                        dataKey="date" 
                        tickFormatter={(date) => new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                        stroke="#6B7280"
                      />
                      <YAxis stroke="#6B7280" />
                      <Tooltip 
                        labelFormatter={(date) => new Date(date).toLocaleDateString()}
                        contentStyle={{ borderRadius: '8px', border: '1px solid #E5E7EB' }}
                      />
                      <Legend />
                      <Line type="monotone" dataKey="total_tickets" stroke="#0033A0" name="Total Tickets" strokeWidth={3} dot={{ r: 4 }} />
                      <Line type="monotone" dataKey="completed" stroke="#10B981" name="Completed" strokeWidth={3} dot={{ r: 4 }} />
                    </LineChart>
                  </ResponsiveContainer>
                )}
              </CardContent>
            </Card>

            {/* Pie Chart - Status Distribution */}
            <Card className="bg-white/80 backdrop-blur-xl border border-white/50 shadow-lg overflow-hidden">
              <CardHeader className="border-b border-gray-200 bg-white/50 backdrop-blur-sm pb-4">
                <CardTitle className="text-xl font-bold text-gray-900">Status Distribution</CardTitle>
                <p className="text-sm text-gray-500 mt-1">Breakdown of ticket statuses</p>
              </CardHeader>
              <CardContent className="pt-6">
                {loading ? (
                  <div className="h-[300px] flex items-center justify-center">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#0033A0]"></div>
                  </div>
                ) : (
                  <ResponsiveContainer width="100%" height={300}>
                    <PieChart>
                      <Pie
                        data={pieData}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                        outerRadius={90}
                        fill="#8884d8"
                        dataKey="value"
                      >
                        {pieData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip contentStyle={{ borderRadius: '8px', border: '1px solid #E5E7EB' }} />
                    </PieChart>
                  </ResponsiveContainer>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Average Times */}
          <Card className="bg-white/80 backdrop-blur-xl border border-white/50 shadow-lg overflow-hidden">
            <CardHeader className="border-b border-gray-200 bg-white/50 backdrop-blur-sm pb-4">
              <CardTitle className="text-xl font-bold text-gray-900">Average Service & Wait Times</CardTitle>
              <p className="text-sm text-gray-500 mt-1">Compare wait times vs service times by day</p>
            </CardHeader>
            <CardContent className="pt-6">
              {loading ? (
                <div className="h-[300px] flex items-center justify-center">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#0033A0]"></div>
                </div>
              ) : (
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={dailySummary}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                    <XAxis 
                      dataKey="date" 
                      tickFormatter={(date) => new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                      stroke="#6B7280"
                    />
                    <YAxis label={{ value: 'Seconds', angle: -90, position: 'insideLeft' }} stroke="#6B7280" />
                    <Tooltip 
                      labelFormatter={(date) => new Date(date).toLocaleDateString()}
                      formatter={(value: number) => [formatDuration(value), '']}
                      contentStyle={{ borderRadius: '8px', border: '1px solid #E5E7EB' }}
                    />
                    <Legend />
                    <Bar dataKey="avg_wait_time" fill="#3B82F6" name="Avg Wait Time" radius={[8, 8, 0, 0]} />
                    <Bar dataKey="avg_service_time" fill="#10B981" name="Avg Service Time" radius={[8, 8, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="staff" className="space-y-6">
          {/* Export Buttons */}
          <div className="flex justify-end gap-3">
            <Button 
              onClick={handleExportStaffCSV} 
              disabled={exporting || loading}
              variant="outline"
              className="
                 gap-2 
              text-white
           border-[#0033A0] text-[#0033A0]
              
              
              
              "
            >
              <Download className="h-4 w-4" />
              Export CSV
            </Button>
            <Button 
              onClick={handleExportStaffPDF} 
                   variant="outline"
              disabled={exporting || loading}
              className="

                 gap-2 
              text-white
           border-[#0033A0] text-[#0033A0]

          "
            >
              <FileText className="h-4 w-4" />
              Export PDF
            </Button>
          </div>

          {/* Staff Performance Summary Cards */}
          <div className="grid gap-4 md:grid-cols-3">
            <Card className="group relative overflow-hidden border-0 bg-white shadow-md hover:shadow-xl transition-all duration-400 hover:-translate-y-1 rounded-xl">
              <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-purple-100 from-purple-600 to-transparent" />
              <CardContent className="relative p-4">
                <div className="flex items-start justify-between mb-2">
                  <div className="rounded-xl p-2.5 bg-purple-100 transition-all duration-400 group-hover:scale-105 shadow">
                    <Users className="h-5 w-5 text-purple-600" />
                  </div>
                  <div className="text-right leading-tight">
                    <div className="text-3xl font-bold bg-gradient-to-br from-gray-900 to-gray-600 bg-clip-text text-transparent mb-0.5">
                      {activeStaff}
                    </div>
                  </div>
                </div>
                <div>
                  <p className="text-xs font-bold text-gray-800">Total Staff</p>
                  <p className="text-[10px] text-gray-500">Active in selected period</p>
                </div>
              </CardContent>
            </Card>

            <Card className="group relative overflow-hidden border-0 bg-white shadow-md hover:shadow-xl transition-all duration-400 hover:-translate-y-1 rounded-xl">
              <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-indigo-100 from-indigo-600 to-transparent" />
              <CardContent className="relative p-4">
                <div className="flex items-start justify-between mb-2">
                  <div className="rounded-xl p-2.5 bg-indigo-100 transition-all duration-400 group-hover:scale-105 shadow">
                    <BarChart3 className="h-5 w-5 text-indigo-600" />
                  </div>
                  <div className="text-right leading-tight">
                    <div className="text-3xl font-bold bg-gradient-to-br from-gray-900 to-gray-600 bg-clip-text text-transparent mb-0.5">
                      {activeStaff > 0 ? Math.round(totalTickets / activeStaff) : 0}
                    </div>
                  </div>
                </div>
                <div>
                  <p className="text-xs font-bold text-gray-800">Avg Tickets/Staff</p>
                  <p className="text-[10px] text-gray-500">Per staff member</p>
                </div>
              </CardContent>
            </Card>

            <Card className="group relative overflow-hidden border-0 bg-white shadow-md hover:shadow-xl transition-all duration-400 hover:-translate-y-1 rounded-xl">
              <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-pink-100 from-pink-600 to-transparent" />
              <CardContent className="relative p-4">
                <div className="flex items-start justify-between mb-2">
                  <div className="rounded-xl p-2.5 bg-pink-100 transition-all duration-400 group-hover:scale-105 shadow">
                    <TrendingUp className="h-5 w-5 text-pink-600" />
                  </div>
                  <div className="text-right leading-tight">
                    <div className="text-3xl font-bold bg-gradient-to-br from-gray-900 to-gray-600 bg-clip-text text-transparent mb-0.5">
                      {staffPerformance.reduce((sum, s) => sum + s.tickets_transferred_out, 0)}
                    </div>
                  </div>
                </div>
                <div>
                  <p className="text-xs font-bold text-gray-800">Total Transfers</p>
                  <p className="text-[10px] text-gray-500">Tickets transferred</p>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Staff Performance Table */}
          <Card className="bg-white/80 backdrop-blur-xl border border-white/50 shadow-lg overflow-hidden">
            <CardHeader className="border-b border-gray-200 bg-white/50 backdrop-blur-sm pb-4">
              <CardTitle className="text-xl font-bold text-gray-900">Staff Performance Details</CardTitle>
              <p className="text-sm text-gray-500 mt-1">Detailed metrics for each staff member</p>
            </CardHeader>
            <CardContent className="pt-6">
              {loading ? (
                <div className="h-[400px] flex items-center justify-center">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#0033A0]"></div>
                </div>
              ) : staffPerformance.length === 0 ? (
                <div className="h-[200px] flex items-center justify-center text-gray-500 bg-gray-50 rounded-lg">
                  No staff performance data available for this period
                </div>
              ) : (
                <div className="overflow-x-auto bg-white rounded-lg border border-gray-200">
                  <table className="w-full">
                    <thead className="bg-gradient-to-r from-gray-50 to-blue-50">
                      <tr className="border-b border-gray-200">
                        <th className="text-left p-4 font-semibold text-gray-700">Staff Name</th>
                        <th className="text-left p-4 font-semibold text-gray-700">Counter</th>
                        <th className="text-right p-4 font-semibold text-gray-700">Tickets Served</th>
                        <th className="text-right p-4 font-semibold text-gray-700">Completed</th>
                        <th className="text-right p-4 font-semibold text-gray-700">Completion Rate</th>
                        <th className="text-right p-4 font-semibold text-gray-700">Avg Service Time</th>
                        <th className="text-right p-4 font-semibold text-gray-700">Transferred Out</th>
                        <th className="text-right p-4 font-semibold text-gray-700">Transferred In</th>
                      </tr>
                    </thead>
                    <tbody>
                      {Object.values(
                        staffPerformance.reduce((acc, perf) => {
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
                        }, {} as Record<string, any>)
                      )
                        .map((staff: any) => ({
                          ...staff,
                          avg_service_time: staff.avg_service_time / staff.count,
                          completion_rate: staff.tickets_served > 0 
                            ? (staff.completed / staff.tickets_served) * 100 
                            : 0,
                        }))
                        .sort((a, b) => b.tickets_served - a.tickets_served)
                        .map((staff: any, index) => (
                          <tr key={index} className="border-b border-gray-100 hover:bg-blue-50 transition-colors duration-150">
                            <td className="p-4 font-medium">{staff.staff_name}</td>
                            <td className="p-4 text-gray-600">{staff.counter_name}</td>
                            <td className="p-4 text-right">{staff.tickets_served}</td>
                            <td className="p-4 text-right">{staff.completed}</td>
                            <td className="p-4 text-right">
                              <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                                staff.completion_rate >= 90 
                                  ? 'bg-green-100 text-green-800'
                                  : staff.completion_rate >= 75
                                  ? 'bg-yellow-100 text-yellow-800'
                                  : 'bg-red-100 text-red-800'
                              }`}>
                                {staff.completion_rate.toFixed(1)}%
                              </span>
                            </td>
                            <td className="p-4 text-right">
                              {formatDuration(Math.round(staff.avg_service_time))}
                            </td>
                            <td className="p-4 text-right">
                              <span className="text-orange-600">{staff.tickets_transferred_out}</span>
                            </td>
                            <td className="p-4 text-right">
                              <span className="text-blue-600">{staff.tickets_transferred_in}</span>
                            </td>
                          </tr>
                        ))}
                    </tbody>
                  </table>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Top Performers Chart */}
          <Card className="bg-white/80 backdrop-blur-xl border border-white/50 shadow-lg overflow-hidden">
            <CardHeader className="border-b border-gray-200 bg-white/50 backdrop-blur-sm pb-4">
              <CardTitle className="text-xl font-bold text-gray-900">Top Performers (by Tickets Served)</CardTitle>
              <p className="text-sm text-gray-500 mt-1">Top 10 staff members by ticket volume</p>
            </CardHeader>
            <CardContent className="pt-6">
              {loading ? (
                <div className="h-[300px] flex items-center justify-center">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#0033A0]"></div>
                </div>
              ) : (
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart 
                    data={Object.values(
                      staffPerformance.reduce((acc, perf) => {
                        if (!acc[perf.staff_id]) {
                          acc[perf.staff_id] = {
                            staff_name: perf.staff_name,
                            tickets_served: 0,
                            completed: 0,
                          };
                        }
                        acc[perf.staff_id].tickets_served += perf.tickets_served;
                        acc[perf.staff_id].completed += perf.completed;
                        return acc;
                      }, {} as Record<string, any>)
                    )
                      .sort((a: any, b: any) => b.tickets_served - a.tickets_served)
                      .slice(0, 10)}
                    layout="vertical"
                  >
                    <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                    <XAxis type="number" stroke="#6B7280" />
                    <YAxis dataKey="staff_name" type="category" width={120} stroke="#6B7280" />
                    <Tooltip contentStyle={{ borderRadius: '8px', border: '1px solid #E5E7EB' }} />
                    <Legend />
                    <Bar dataKey="tickets_served" fill="#0033A0" name="Tickets Served" radius={[0, 8, 8, 0]} />
                    <Bar dataKey="completed" fill="#10B981" name="Completed" radius={[0, 8, 8, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="heatmap" className="space-y-4">
          {/* Export Button */}
          <div className="flex justify-end gap-3">
            <Button 
              onClick={handleExportHourlyCSV} 
              disabled={exporting || loading}
              variant="outline"
              className="
              gap-2 
              text-white
              bg-blue-700
              
              border-gray-300 hover:border-[#0033A0] hover:text-[#0033A0]"
            >
              <Download className="h-4 w-4" />
              Export CSV
            </Button>
          </div>
          
          <BusyHoursHeatmap hourlyTraffic={hourlyTraffic} loading={loading} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
