'use client';

import { useState, useEffect } from 'react';
import { BarChart3, TrendingUp, Clock, Users, CheckCircle, Target, Calendar, Award } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useAuth } from '@/lib/hooks/use-auth';
import { formatDuration } from '@/lib/utils';
import { createClient } from '@/lib/supabase/client';

interface DailyStats {
  date: string;
  tickets_served: number;
  avg_service_time: number;
  avg_wait_time: number;
}

interface PerformanceStats {
  total_served: number;
  avg_service_time: number;
  avg_wait_time: number;
  completion_rate: number;
  daily_average: number;
  best_day: {
    date: string;
    count: number;
  };
  efficiency_score: number;
}

export default function StaffStatsPage() {
  const { profile } = useAuth();
  const [stats, setStats] = useState<PerformanceStats>({
    total_served: 0,
    avg_service_time: 0,
    avg_wait_time: 0,
    completion_rate: 0,
    daily_average: 0,
    best_day: { date: '', count: 0 },
    efficiency_score: 0
  });
  const [dailyStats, setDailyStats] = useState<DailyStats[]>([]);
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState<string>('week');

  useEffect(() => {
    fetchStats();
  }, [period]);

  const fetchStats = async () => {
    const supabase = createClient();
    setLoading(true);

    try {
      // Get current counter assignment
      const { data: counter } = await supabase
        .from('counters')
        .select('*')
        .eq('staff_id', profile?.id)
        .single();

      if (!counter) {
        setLoading(false);
        return;
      }

      // Calculate date range
      let startDate = new Date();
      let days = 7;
      switch (period) {
        case 'week':
          startDate.setDate(startDate.getDate() - 7);
          days = 7;
          break;
        case 'month':
          startDate.setMonth(startDate.getMonth() - 1);
          days = 30;
          break;
        case 'quarter':
          startDate.setMonth(startDate.getMonth() - 3);
          days = 90;
          break;
        default:
          startDate.setDate(startDate.getDate() - 7);
          days = 7;
      }

      // Get all tickets for the period
      const { data: tickets, error } = await supabase
        .from('tickets')
        .select('*')
        .eq('counter_id', counter.id)
        .gte('created_at', startDate.toISOString())
        .order('created_at', { ascending: true });

      if (error) throw error;

      const allTickets = tickets || [];
      const completedTickets = allTickets.filter(t => t.status === 'done');
      const cancelledTickets = allTickets.filter(t => t.status === 'cancelled');
      const skippedTickets = allTickets.filter(t => t.status === 'skipped');

      // Calculate performance stats
      const totalServed = completedTickets.length;
      const totalProcessed = allTickets.length;
      const completionRate = totalProcessed > 0 ? (totalServed / totalProcessed) * 100 : 0;
      
      // Calculate service times
      const serviceTimes = completedTickets
        .filter(t => t.started_at && t.completed_at)
        .map(t => {
          const start = new Date(t.started_at!).getTime();
          const end = new Date(t.completed_at!).getTime();
          return Math.floor((end - start) / 1000);
        });
      
      const avgServiceTime = serviceTimes.length > 0
        ? serviceTimes.reduce((sum, time) => sum + time, 0) / serviceTimes.length
        : 0;

      // Calculate wait times
      const waitTimes = allTickets
        .filter(t => t.started_at)
        .map(t => {
          const created = new Date(t.created_at).getTime();
          const started = new Date(t.started_at!).getTime();
          return Math.floor((started - created) / 1000);
        });
      
      const avgWaitTime = waitTimes.length > 0
        ? waitTimes.reduce((sum, time) => sum + time, 0) / waitTimes.length
        : 0;

      // Calculate daily stats
      const dailyMap = new Map<string, DailyStats>();
      
      // Initialize all days in range
      for (let i = 0; i < days; i++) {
        const date = new Date();
        date.setDate(date.getDate() - i);
        const dateStr = date.toISOString().split('T')[0];
        dailyMap.set(dateStr, {
          date: dateStr,
          tickets_served: 0,
          avg_service_time: 0,
          avg_wait_time: 0
        });
      }

      // Populate with actual data
      completedTickets.forEach(ticket => {
        const dateStr = ticket.created_at.split('T')[0];
        const existing = dailyMap.get(dateStr);
        if (existing) {
          existing.tickets_served += 1;
        }
      });

      const dailyStatsArray = Array.from(dailyMap.values())
        .sort((a, b) => a.date.localeCompare(b.date));

      // Find best day
      const bestDay = dailyStatsArray.reduce((best, current) => 
        current.tickets_served > best.count 
          ? { date: current.date, count: current.tickets_served }
          : best
      , { date: '', count: 0 });

      // Calculate efficiency score (0-100)
      const targetServiceTime = 300; // 5 minutes target
      const serviceEfficiency = avgServiceTime > 0 
        ? Math.max(0, 100 - ((avgServiceTime - targetServiceTime) / targetServiceTime) * 100)
        : 0;
      const completionEfficiency = completionRate;
      const efficiencyScore = Math.round((serviceEfficiency + completionEfficiency) / 2);

      setStats({
        total_served: totalServed,
        avg_service_time: avgServiceTime,
        avg_wait_time: avgWaitTime,
        completion_rate: completionRate,
        daily_average: totalServed / days,
        best_day: bestDay,
        efficiency_score: Math.max(0, Math.min(100, efficiencyScore))
      });

      setDailyStats(dailyStatsArray);

    } catch (error) {
      console.error('Error fetching stats:', error);
    } finally {
      setLoading(false);
    }
  };

  const getEfficiencyColor = (score: number) => {
    if (score >= 80) return 'text-green-600';
    if (score >= 60) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getEfficiencyBgColor = (score: number) => {
    if (score >= 80) return 'bg-green-100';
    if (score >= 60) return 'bg-yellow-100';
    return 'bg-red-100';
  };

  const statCards = [
    {
      title: 'Total Served',
      value: stats.total_served,
      icon: CheckCircle,
      color: 'text-green-600',
      bgColor: 'bg-green-100',
      subtitle: `${stats.daily_average.toFixed(1)} per day avg`
    },
    {
      title: 'Avg Service Time',
      value: formatDuration(stats.avg_service_time),
      icon: Clock,
      color: 'text-blue-600',
      bgColor: 'bg-blue-100',
      subtitle: 'Per ticket'
    },
    {
      title: 'Completion Rate',
      value: `${stats.completion_rate.toFixed(1)}%`,
      icon: Target,
      color: 'text-purple-600',
      bgColor: 'bg-purple-100',
      subtitle: 'Success rate'
    },
    {
      title: 'Efficiency Score',
      value: `${stats.efficiency_score}%`,
      icon: Award,
      color: getEfficiencyColor(stats.efficiency_score),
      bgColor: getEfficiencyBgColor(stats.efficiency_score),
      subtitle: 'Overall performance'
    },
  ];

  if (loading) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#0033A0]"></div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-4xl font-bold text-gray-900">Statistics</h1>
          <p className="mt-2 text-lg text-gray-600">Track your performance and productivity</p>
        </div>
        <div className="flex items-center gap-2">
          <Select value={period} onValueChange={setPeriod}>
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="week">This Week</SelectItem>
              <SelectItem value="month">This Month</SelectItem>
              <SelectItem value="quarter">This Quarter</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Performance Cards */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        {statCards.map((stat) => (
          <Card 
            key={stat.title}
            className="group relative overflow-hidden border-0 bg-white shadow-lg transition-all duration-300 hover:shadow-xl hover:-translate-y-1"
          >
            <div className={`absolute inset-0 opacity-5 ${stat.bgColor}`} />
            
            <CardHeader className="relative flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-semibold uppercase tracking-wide text-gray-500">
                {stat.title}
              </CardTitle>
              <div className={`rounded-xl p-3 ${stat.bgColor} transition-transform duration-300 group-hover:scale-110`}>
                <stat.icon className={`h-6 w-6 ${stat.color}`} />
              </div>
            </CardHeader>
            
            <CardContent className="relative">
              <div className="text-4xl font-bold text-gray-900">{stat.value}</div>
              <p className="mt-2 text-xs text-gray-500">{stat.subtitle}</p>
            </CardContent>
            
            <div className={`absolute bottom-0 left-0 h-1 w-full ${stat.bgColor}`} />
          </Card>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Daily Performance Chart */}
        <Card className="border-0 shadow-xl overflow-hidden">
          <CardHeader className="bg-gradient-to-r from-[#0033A0] to-[#1A237E] text-white">
            <CardTitle className="text-xl flex items-center gap-2">
              <BarChart3 className="h-5 w-5" />
              Daily Performance
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            <div className="space-y-4">
              {dailyStats.slice(-7).map((day, index) => {
                const maxTickets = Math.max(...dailyStats.map(d => d.tickets_served), 1);
                const percentage = (day.tickets_served / maxTickets) * 100;
                
                return (
                  <div key={day.date} className="flex items-center gap-4">
                    <div className="w-20 text-sm text-gray-600">
                      {new Date(day.date).toLocaleDateString('en-US', { 
                        weekday: 'short',
                        month: 'short',
                        day: 'numeric'
                      })}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <div className="flex-1 bg-gray-200 rounded-full h-3 overflow-hidden">
                          <div 
                            className="h-full bg-gradient-to-r from-[#0033A0] to-[#1A237E] transition-all duration-500"
                            style={{ width: `${percentage}%` }}
                          />
                        </div>
                        <span className="text-sm font-semibold text-gray-900 w-8">
                          {day.tickets_served}
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>

        {/* Performance Insights */}
        <Card className="border-0 shadow-xl overflow-hidden">
          <CardHeader className="bg-gradient-to-r from-[#0033A0] to-[#1A237E] text-white">
            <CardTitle className="text-xl flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              Performance Insights
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            <div className="space-y-6">
              {/* Best Day */}
              <div className="flex items-center justify-between p-4 bg-green-50 rounded-lg">
                <div>
                  <p className="text-sm text-green-600 font-medium">Best Day</p>
                  <p className="text-lg font-bold text-green-900">
                    {stats.best_day.date ? new Date(stats.best_day.date).toLocaleDateString() : 'N/A'}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-2xl font-bold text-green-600">{stats.best_day.count}</p>
                  <p className="text-sm text-green-600">tickets served</p>
                </div>
              </div>

              {/* Average Wait Time */}
              <div className="flex items-center justify-between p-4 bg-blue-50 rounded-lg">
                <div>
                  <p className="text-sm text-blue-600 font-medium">Avg Wait Time</p>
                  <p className="text-lg font-bold text-blue-900">
                    {formatDuration(stats.avg_wait_time)}
                  </p>
                </div>
                <div className="text-right">
                  <Clock className="h-8 w-8 text-blue-600" />
                </div>
              </div>

              {/* Efficiency Rating */}
              <div className={`flex items-center justify-between p-4 rounded-lg ${getEfficiencyBgColor(stats.efficiency_score)}`}>
                <div>
                  <p className={`text-sm font-medium ${getEfficiencyColor(stats.efficiency_score)}`}>Efficiency Rating</p>
                  <p className={`text-lg font-bold ${getEfficiencyColor(stats.efficiency_score).replace('text-', 'text-').replace('-600', '-900')}`}>
                    {stats.efficiency_score >= 80 ? 'Excellent' : 
                     stats.efficiency_score >= 60 ? 'Good' : 'Needs Improvement'}
                  </p>
                </div>
                <div className="text-right">
                  <p className={`text-2xl font-bold ${getEfficiencyColor(stats.efficiency_score)}`}>
                    {stats.efficiency_score}%
                  </p>
                </div>
              </div>

              {/* Performance Tips */}
              <div className="p-4 bg-yellow-50 rounded-lg">
                <p className="text-sm text-yellow-600 font-medium mb-2">💡 Performance Tip</p>
                <p className="text-sm text-yellow-800">
                  {stats.avg_service_time > 300 
                    ? "Try to reduce service time by preparing common forms in advance."
                    : stats.completion_rate < 90
                    ? "Focus on completing more tickets to improve your success rate."
                    : "Great job! Keep maintaining your excellent performance."}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}