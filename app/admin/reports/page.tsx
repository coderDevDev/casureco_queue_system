'use client';

import { useState, useEffect } from 'react';
import { Calendar, Download, BarChart3, Users, Clock, TrendingUp } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { LineChart, Line, BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { getDailySummary, getStaffPerformance, getHourlyTraffic, exportToCSV, DailySummary, StaffPerformance, HourlyTraffic } from '@/lib/services/reports-service';
import { useAuth } from '@/lib/hooks/use-auth';
import { formatDuration } from '@/lib/utils';
import { BusyHoursHeatmap } from '@/components/admin/reports/busy-hours-heatmap';

const COLORS = {
  completed: '#10B981',
  cancelled: '#EF4444',
  skipped: '#F59E0B',
  waiting: '#3B82F6',
};

export default function ReportsPage() {
  const { profile } = useAuth();
  const [dateRange, setDateRange] = useState({
    start: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), // Last 7 days
    end: new Date(),
  });
  const [dailySummary, setDailySummary] = useState<DailySummary[]>([]);
  const [staffPerformance, setStaffPerformance] = useState<StaffPerformance[]>([]);
  const [hourlyTraffic, setHourlyTraffic] = useState<HourlyTraffic[]>([]);
  const [loading, setLoading] = useState(true);

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
    } finally {
      setLoading(false);
    }
  }

  // Calculate totals for quick stats
  const totalTickets = dailySummary.reduce((sum, day) => sum + day.total_tickets, 0);
  const totalCompleted = dailySummary.reduce((sum, day) => sum + day.completed, 0);
  const avgWaitTime = dailySummary.reduce((sum, day) => sum + day.avg_wait_time, 0) / (dailySummary.length || 1);
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

  function handleExport() {
    exportToCSV(dailySummary, 'daily-summary');
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-4xl font-bold text-gray-900">Reports & Analytics</h1>
          <p className="mt-2 text-lg text-gray-600">
            Comprehensive insights into queue performance and staff metrics
          </p>
        </div>
        <div className="flex gap-3">
          <Button variant="outline" className="gap-2 border-gray-300 hover:border-[#0033A0] hover:text-[#0033A0]">
            <Calendar className="h-4 w-4" />
            Last 7 Days
          </Button>
          <Button onClick={handleExport} className="gap-2 bg-gradient-to-r from-[#0033A0] to-[#0055CC] hover:from-[#002080] hover:to-[#0033A0] shadow-lg">
            <Download className="h-4 w-4" />
            Export CSV
          </Button>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        {/* Total Tickets Card */}
        <Card className="group relative overflow-hidden border-0 bg-white shadow-lg transition-all duration-300 hover:shadow-xl hover:-translate-y-1">
          <div className="absolute inset-0 opacity-5 bg-blue-100" />
          <CardHeader className="relative flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-semibold uppercase tracking-wide text-gray-500">
              Total Tickets
            </CardTitle>
            <div className="rounded-xl p-3 bg-blue-100 transition-transform duration-300 group-hover:scale-110">
              <BarChart3 className="h-6 w-6 text-blue-600" />
            </div>
          </CardHeader>
          <CardContent className="relative">
            <div className="text-4xl font-bold text-gray-900">{totalTickets.toLocaleString()}</div>
            <p className="mt-2 text-xs text-gray-500">Last {dailySummary.length} days</p>
          </CardContent>
          <div className="absolute bottom-0 left-0 h-1 w-full bg-blue-100" />
        </Card>

        {/* Avg Wait Time Card */}
        <Card className="group relative overflow-hidden border-0 bg-white shadow-lg transition-all duration-300 hover:shadow-xl hover:-translate-y-1">
          <div className="absolute inset-0 opacity-5 bg-orange-100" />
          <CardHeader className="relative flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-semibold uppercase tracking-wide text-gray-500">
              Avg Wait Time
            </CardTitle>
            <div className="rounded-xl p-3 bg-orange-100 transition-transform duration-300 group-hover:scale-110">
              <Clock className="h-6 w-6 text-orange-600" />
            </div>
          </CardHeader>
          <CardContent className="relative">
            <div className="text-4xl font-bold text-gray-900">{formatDuration(Math.round(avgWaitTime))}</div>
            <p className="mt-2 text-xs text-gray-500">Average wait time</p>
          </CardContent>
          <div className="absolute bottom-0 left-0 h-1 w-full bg-orange-100" />
        </Card>

        {/* Completion Rate Card */}
        <Card className="group relative overflow-hidden border-0 bg-white shadow-lg transition-all duration-300 hover:shadow-xl hover:-translate-y-1">
          <div className="absolute inset-0 opacity-5 bg-green-100" />
          <CardHeader className="relative flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-semibold uppercase tracking-wide text-gray-500">
              Completion Rate
            </CardTitle>
            <div className="rounded-xl p-3 bg-green-100 transition-transform duration-300 group-hover:scale-110">
              <TrendingUp className="h-6 w-6 text-green-600" />
            </div>
          </CardHeader>
          <CardContent className="relative">
            <div className="text-4xl font-bold text-gray-900">{completionRate.toFixed(1)}%</div>
            <p className="mt-2 text-xs text-gray-500">{totalCompleted} of {totalTickets} completed</p>
          </CardContent>
          <div className="absolute bottom-0 left-0 h-1 w-full bg-green-100" />
        </Card>

        {/* Active Staff Card */}
        <Card className="group relative overflow-hidden border-0 bg-white shadow-lg transition-all duration-300 hover:shadow-xl hover:-translate-y-1">
          <div className="absolute inset-0 opacity-5 bg-purple-100" />
          <CardHeader className="relative flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-semibold uppercase tracking-wide text-gray-500">
              Active Staff
            </CardTitle>
            <div className="rounded-xl p-3 bg-purple-100 transition-transform duration-300 group-hover:scale-110">
              <Users className="h-6 w-6 text-purple-600" />
            </div>
          </CardHeader>
          <CardContent className="relative">
            <div className="text-4xl font-bold text-gray-900">{activeStaff}</div>
            <p className="mt-2 text-xs text-gray-500">Active staff members</p>
          </CardContent>
          <div className="absolute bottom-0 left-0 h-1 w-full bg-purple-100" />
        </Card>
      </div>

      {/* Tabs for Different Reports */}
      <Tabs defaultValue="daily" className="space-y-6">
        <TabsList className="bg-gray-100 p-1">
          <TabsTrigger value="daily" className="data-[state=active]:bg-white data-[state=active]:shadow-sm">Daily Summary</TabsTrigger>
          {/* <TabsTrigger value="weekly">Weekly Summary</TabsTrigger> */}
          <TabsTrigger value="staff" className="data-[state=active]:bg-white data-[state=active]:shadow-sm">Staff Performance</TabsTrigger>
          <TabsTrigger value="heatmap" className="data-[state=active]:bg-white data-[state=active]:shadow-sm">Busy Hours</TabsTrigger>
        </TabsList>

        <TabsContent value="daily" className="space-y-6">
          <div className="grid gap-6 md:grid-cols-2">
            {/* Line Chart - Tickets Over Time */}
            <Card className="border-0 shadow-lg hover:shadow-xl transition-shadow duration-300">
              <CardHeader className="pb-4">
                <CardTitle className="text-xl font-bold text-gray-900">Tickets Over Time</CardTitle>
                <p className="text-sm text-gray-500 mt-1">Daily ticket trends and completion rates</p>
              </CardHeader>
              <CardContent className="pt-0">
                {loading ? (
                  <div className="h-[300px] flex items-center justify-center bg-gray-50 rounded-lg">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                  </div>
                ) : (
                  <div className="bg-gradient-to-br from-gray-50 to-white p-4 rounded-lg">
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
                        <Line type="monotone" dataKey="total_tickets" stroke="#0033A0" name="Total Tickets" strokeWidth={3} dot={{ r: 4 }} activeDot={{ r: 6 }} />
                        <Line type="monotone" dataKey="completed" stroke="#10B981" name="Completed" strokeWidth={3} dot={{ r: 4 }} activeDot={{ r: 6 }} />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Pie Chart - Status Distribution */}
            <Card className="border-0 shadow-lg hover:shadow-xl transition-shadow duration-300">
              <CardHeader className="pb-4">
                <CardTitle className="text-xl font-bold text-gray-900">Status Distribution</CardTitle>
                <p className="text-sm text-gray-500 mt-1">Breakdown of ticket statuses</p>
              </CardHeader>
              <CardContent className="pt-0">
                {loading ? (
                  <div className="h-[300px] flex items-center justify-center bg-gray-50 rounded-lg">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                  </div>
                ) : (
                  <div className="bg-gradient-to-br from-gray-50 to-white p-4 rounded-lg">
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
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Average Times */}
          <Card className="border-0 shadow-lg hover:shadow-xl transition-shadow duration-300">
            <CardHeader className="pb-4">
              <CardTitle className="text-xl font-bold text-gray-900">Average Service & Wait Times</CardTitle>
              <p className="text-sm text-gray-500 mt-1">Compare wait times vs service times by day</p>
            </CardHeader>
            <CardContent className="pt-0">
              {loading ? (
                <div className="h-[300px] flex items-center justify-center bg-gray-50 rounded-lg">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                </div>
              ) : (
                <div className="bg-gradient-to-br from-gray-50 to-white p-4 rounded-lg">
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
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="staff" className="space-y-6">
          {/* Staff Performance Summary Cards */}
          <div className="grid gap-6 md:grid-cols-3">
            <Card className="group relative overflow-hidden border-0 bg-white shadow-lg transition-all duration-300 hover:shadow-xl hover:-translate-y-1">
              <div className="absolute inset-0 opacity-5 bg-purple-100" />
              <CardHeader className="relative flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-semibold uppercase tracking-wide text-gray-500">Total Staff</CardTitle>
                <div className="rounded-xl p-3 bg-purple-100 transition-transform duration-300 group-hover:scale-110">
                  <Users className="h-6 w-6 text-purple-600" />
                </div>
              </CardHeader>
              <CardContent className="relative">
                <div className="text-4xl font-bold text-gray-900">{activeStaff}</div>
                <p className="mt-2 text-xs text-gray-500">Active in selected period</p>
              </CardContent>
              <div className="absolute bottom-0 left-0 h-1 w-full bg-purple-100" />
            </Card>

            <Card className="group relative overflow-hidden border-0 bg-white shadow-lg transition-all duration-300 hover:shadow-xl hover:-translate-y-1">
              <div className="absolute inset-0 opacity-5 bg-indigo-100" />
              <CardHeader className="relative flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-semibold uppercase tracking-wide text-gray-500">Avg Tickets/Staff</CardTitle>
                <div className="rounded-xl p-3 bg-indigo-100 transition-transform duration-300 group-hover:scale-110">
                  <BarChart3 className="h-6 w-6 text-indigo-600" />
                </div>
              </CardHeader>
              <CardContent className="relative">
                <div className="text-4xl font-bold text-gray-900">
                  {activeStaff > 0 ? Math.round(totalTickets / activeStaff) : 0}
                </div>
                <p className="mt-2 text-xs text-gray-500">Per staff member</p>
              </CardContent>
              <div className="absolute bottom-0 left-0 h-1 w-full bg-indigo-100" />
            </Card>

            <Card className="group relative overflow-hidden border-0 bg-white shadow-lg transition-all duration-300 hover:shadow-xl hover:-translate-y-1">
              <div className="absolute inset-0 opacity-5 bg-pink-100" />
              <CardHeader className="relative flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-semibold uppercase tracking-wide text-gray-500">Total Transfers</CardTitle>
                <div className="rounded-xl p-3 bg-pink-100 transition-transform duration-300 group-hover:scale-110">
                  <TrendingUp className="h-6 w-6 text-pink-600" />
                </div>
              </CardHeader>
              <CardContent className="relative">
                <div className="text-4xl font-bold text-gray-900">
                  {staffPerformance.reduce((sum, s) => sum + s.tickets_transferred_out, 0)}
                </div>
                <p className="mt-2 text-xs text-gray-500">Tickets transferred</p>
              </CardContent>
              <div className="absolute bottom-0 left-0 h-1 w-full bg-pink-100" />
            </Card>
          </div>

          {/* Staff Performance Table */}
          <Card className="border-0 shadow-lg hover:shadow-xl transition-shadow duration-300">
            <CardHeader className="pb-4">
              <CardTitle className="text-xl font-bold text-gray-900">Staff Performance Details</CardTitle>
              <p className="text-sm text-gray-500 mt-1">Detailed metrics for each staff member</p>
            </CardHeader>
            <CardContent className="pt-0">
              {loading ? (
                <div className="h-[400px] flex items-center justify-center bg-gray-50 rounded-lg">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                </div>
              ) : staffPerformance.length === 0 ? (
                <div className="h-[200px] flex items-center justify-center text-gray-500 bg-gray-50 rounded-lg">
                  No staff performance data available for this period
                </div>
              ) : (
                <div className="overflow-x-auto bg-white rounded-lg border border-gray-200">
                  <table className="w-full">
                    <thead className="bg-gray-50">
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
                      {/* Group by staff and aggregate */}
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
                        }, {} as any)
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
          <Card className="border-0 shadow-lg hover:shadow-xl transition-shadow duration-300">
            <CardHeader className="pb-4">
              <CardTitle className="text-xl font-bold text-gray-900">Top Performers (by Tickets Served)</CardTitle>
              <p className="text-sm text-gray-500 mt-1">Top 10 staff members by ticket volume</p>
            </CardHeader>
            <CardContent className="pt-0">
              {loading ? (
                <div className="h-[300px] flex items-center justify-center">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                </div>
              ) : (
                <div className="bg-gradient-to-br from-gray-50 to-white p-4 rounded-lg">
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
                        }, {} as any)
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
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="heatmap" className="space-y-4">
          <BusyHoursHeatmap hourlyTraffic={hourlyTraffic} loading={loading} />
        </TabsContent>
      </Tabs>
    </div>
  );
}