'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Building2, Users, Monitor, Briefcase, TrendingUp, Clock } from 'lucide-react';
import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';

interface DashboardStats {
  totalBranches: number;
  totalUsers: number;
  totalCounters: number;
  totalServices: number;
  activeTicketsToday: number;
  averageWaitTime: number;
}

export default function AdminDashboard() {
  const [stats, setStats] = useState<DashboardStats>({
    totalBranches: 0,
    totalUsers: 0,
    totalCounters: 0,
    totalServices: 0,
    activeTicketsToday: 0,
    averageWaitTime: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchStats() {
      const supabase = createClient();

      // Fetch counts
      const [branches, users, counters, services, tickets] = await Promise.all([
        supabase.from('branches').select('id', { count: 'exact', head: true }),
        supabase.from('users').select('id', { count: 'exact', head: true }),
        supabase.from('counters').select('id', { count: 'exact', head: true }),
        supabase.from('services').select('id', { count: 'exact', head: true }),
        supabase
          .from('tickets')
          .select('id', { count: 'exact', head: true })
          .gte('created_at', new Date().toISOString().split('T')[0]),
      ]);

      setStats({
        totalBranches: branches.count || 0,
        totalUsers: users.count || 0,
        totalCounters: counters.count || 0,
        totalServices: services.count || 0,
        activeTicketsToday: tickets.count || 0,
        averageWaitTime: 0, // TODO: Calculate from stats
      });

      setLoading(false);
    }

    fetchStats();
  }, []);

  const statCards = [
    {
      title: 'Total Branches',
      value: stats.totalBranches,
      icon: Building2,
      color: 'text-blue-600',
      bgColor: 'bg-blue-100',
    },
    {
      title: 'Total Users',
      value: stats.totalUsers,
      icon: Users,
      color: 'text-green-600',
      bgColor: 'bg-green-100',
    },
    {
      title: 'Total Counters',
      value: stats.totalCounters,
      icon: Monitor,
      color: 'text-purple-600',
      bgColor: 'bg-purple-100',
    },
    {
      title: 'Total Services',
      value: stats.totalServices,
      icon: Briefcase,
      color: 'text-orange-600',
      bgColor: 'bg-orange-100',
    },
    {
      title: 'Tickets Today',
      value: stats.activeTicketsToday,
      icon: TrendingUp,
      color: 'text-indigo-600',
      bgColor: 'bg-indigo-100',
    },
    {
      title: 'Avg Wait Time',
      value: `${stats.averageWaitTime} min`,
      icon: Clock,
      color: 'text-pink-600',
      bgColor: 'bg-pink-100',
    },
  ];

  if (loading) {
    return <div className="flex h-full items-center justify-center">Loading...</div>;
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-4xl font-bold text-gray-900">Dashboard</h1>
        <p className="mt-2 text-lg text-gray-600">Welcome to CASURECO II Admin Panel</p>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {statCards.map((stat) => (
          <Card 
            key={stat.title}
            className="group relative overflow-hidden border-0 bg-white shadow-lg transition-all duration-300 hover:shadow-xl hover:-translate-y-1"
          >
            {/* Gradient Background */}
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
              <div className="flex items-baseline justify-between">
                <div className="text-4xl font-bold text-gray-900">{stat.value}</div>
                {/* Trend indicator - you can make this dynamic later */}
                <div className="flex items-center gap-1 text-xs font-medium text-green-600">
                  <TrendingUp className="h-3 w-3" />
                  <span>+12%</span>
                </div>
              </div>
              <p className="mt-2 text-xs text-gray-500">vs last month</p>
            </CardContent>
            
            {/* Bottom accent line */}
            <div className={`absolute bottom-0 left-0 h-1 w-full ${stat.bgColor}`} />
          </Card>
        ))}
      </div>
    </div>
  );
}