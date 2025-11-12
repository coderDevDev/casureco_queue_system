'use client';

import { useState, useEffect } from 'react';
import { Clock, CheckCircle, XCircle, SkipForward, Search, Filter, Calendar, User, Ticket } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useAuth } from '@/lib/hooks/use-auth';
import { formatDuration } from '@/lib/utils';
import { createClient } from '@/lib/supabase/client';

interface HistoryTicket {
  id: string;
  ticket_number: string;
  service_id: string;
  status: 'completed' | 'cancelled' | 'skipped';
  priority_level: number;
  counter_id?: string;
  branch_id: string;
  created_at: string;
  called_at?: string;
  started_at?: string;
  ended_at?: string;
  notes?: string;
  customer_name?: string;
  customer_phone?: string;
  served_by?: string;
  service?: {
    name: string;
    prefix: string;
    avg_service_time: number;
  };
  counter?: {
    name: string;
  };
  staff?: {
    name: string;
  };
  service_time: number;
  wait_time: number;
}

export default function StaffHistoryPage() {
  const { profile } = useAuth();
  const [tickets, setTickets] = useState<HistoryTicket[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [dateFilter, setDateFilter] = useState<string>('today');
  const [stats, setStats] = useState({
    completed: 0,
    cancelled: 0,
    skipped: 0,
    avg_service_time: 0
  });

  useEffect(() => {
    fetchHistory();
  }, [dateFilter]);

  const fetchHistory = async () => {
    const supabase = createClient();
    setLoading(true);

    try {
      // Calculate date range
      let startDate = new Date();
      switch (dateFilter) {
        case 'today':
          startDate.setHours(0, 0, 0, 0);
          break;
        case 'week':
          startDate.setDate(startDate.getDate() - 7);
          break;
        case 'month':
          startDate.setMonth(startDate.getMonth() - 1);
          break;
        default:
          startDate.setHours(0, 0, 0, 0);
      }

      // Get historical tickets
      let query = supabase
        .from('tickets')
        .select(`
          *,
          service:services(name, prefix, avg_service_time),
          counter:counters(name),
          staff:users!tickets_served_by_fkey(name)
        `)
        .in('status', ['completed', 'cancelled', 'skipped'])
        .gte('created_at', startDate.toISOString())
        .order('ended_at', { ascending: false, nullsFirst: false })
        .order('created_at', { ascending: false });

      // Filter by staff if not admin/supervisor
      if (profile?.role === 'staff') {
        query = query.eq('served_by', profile.id);
      } else {
        // For admin/supervisor, show branch tickets
        query = query.eq('branch_id', profile?.branch_id);
      }

      const { data, error } = await query;

      if (error) throw error;

      // Transform data
      const transformedTickets: HistoryTicket[] = (data || []).map(ticket => {
        const createdAt = new Date(ticket.created_at).getTime();
        const calledAt = ticket.called_at ? new Date(ticket.called_at).getTime() : createdAt;
        const endedAt = ticket.ended_at ? new Date(ticket.ended_at).getTime() : Date.now();
        
        return {
          id: ticket.id,
          ticket_number: ticket.ticket_number,
          service_id: ticket.service_id,
          status: ticket.status,
          priority_level: ticket.priority_level || 0,
          counter_id: ticket.counter_id,
          branch_id: ticket.branch_id,
          created_at: ticket.created_at,
          called_at: ticket.called_at,
          started_at: ticket.started_at,
          ended_at: ticket.ended_at,
          notes: ticket.notes,
          customer_name: ticket.customer_name,
          customer_phone: ticket.customer_phone,
          served_by: ticket.served_by,
          service: ticket.service,
          counter: ticket.counter,
          staff: ticket.staff,
          service_time: ticket.called_at && ticket.ended_at 
            ? Math.floor((endedAt - calledAt) / 1000)
            : 0,
          wait_time: ticket.called_at 
            ? Math.floor((calledAt - createdAt) / 1000)
            : Math.floor((Date.now() - createdAt) / 1000)
        };
      });

      setTickets(transformedTickets);

      // Calculate stats
      const completed = transformedTickets.filter(t => t.status === 'completed').length;
      const cancelled = transformedTickets.filter(t => t.status === 'cancelled').length;
      const skipped = transformedTickets.filter(t => t.status === 'skipped').length;
      const completedTickets = transformedTickets.filter(t => t.status === 'completed');
      const avgServiceTime = completedTickets.length > 0
        ? completedTickets.reduce((sum, t) => sum + t.service_time, 0) / completedTickets.length
        : 0;

      setStats({
        completed,
        cancelled,
        skipped,
        avg_service_time: avgServiceTime
      });

    } catch (error) {
      console.error('Error fetching history:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredTickets = tickets.filter(ticket => {
    const matchesSearch = 
      ticket.ticket_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
      ticket.customer_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      ticket.service?.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      ticket.staff?.name.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === 'all' || ticket.status === statusFilter;
    
    return matchesSearch && matchesStatus;
  });

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'completed':
        return <Badge className="bg-green-100 text-green-700 hover:bg-green-100">Completed</Badge>;
      case 'cancelled':
        return <Badge className="bg-red-100 text-red-700 hover:bg-red-100">Cancelled</Badge>;
      case 'skipped':
        return <Badge className="bg-yellow-100 text-yellow-700 hover:bg-yellow-100">Skipped</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="h-5 w-5 text-green-600" />;
      case 'cancelled':
        return <XCircle className="h-5 w-5 text-red-600" />;
      case 'skipped':
        return <SkipForward className="h-5 w-5 text-yellow-600" />;
      default:
        return <Clock className="h-5 w-5 text-gray-600" />;
    }
  };

  const statCards = [
    {
      title: 'Completed',
      value: stats.completed,
      icon: CheckCircle,
      color: 'text-green-600',
      bgColor: 'bg-green-100',
    },
    {
      title: 'Cancelled',
      value: stats.cancelled,
      icon: XCircle,
      color: 'text-red-600',
      bgColor: 'bg-red-100',
    },
    {
      title: 'Skipped',
      value: stats.skipped,
      icon: SkipForward,
      color: 'text-yellow-600',
      bgColor: 'bg-yellow-100',
    },
    {
      title: 'Avg Service Time',
      value: formatDuration(stats.avg_service_time),
      icon: Clock,
      color: 'text-blue-600',
      bgColor: 'bg-blue-100',
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
          <h1 className="text-4xl font-bold text-gray-900">History</h1>
          <p className="mt-2 text-lg text-gray-600">View your completed tickets and performance</p>
        </div>
        <div className="flex items-center gap-2">
          <Select value={dateFilter} onValueChange={setDateFilter}>
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="today">Today</SelectItem>
              <SelectItem value="week">This Week</SelectItem>
              <SelectItem value="month">This Month</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-6 md:grid-cols-4">
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
              <p className="mt-2 text-xs text-gray-500">{dateFilter === 'today' ? 'Today' : dateFilter === 'week' ? 'This week' : 'This month'}</p>
            </CardContent>
            
            <div className={`absolute bottom-0 left-0 h-1 w-full ${stat.bgColor}`} />
          </Card>
        ))}
      </div>

      {/* Filters */}
      <Card className="border-0 shadow-lg">
        <CardContent className="p-6">
          <div className="flex items-center gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
              <Input
                placeholder="Search by ticket number, customer name, or service..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-40">
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="completed">Completed</SelectItem>
                <SelectItem value="cancelled">Cancelled</SelectItem>
                <SelectItem value="skipped">Skipped</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* History List */}
      <Card className="border-0 shadow-xl overflow-hidden">
        <CardHeader className="bg-gradient-to-r from-[#0033A0] to-[#1A237E] text-white">
          <CardTitle className="text-xl">Ticket History ({filteredTickets.length})</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {filteredTickets.length === 0 ? (
            <div className="p-8 text-center">
              <Ticket className="mx-auto h-12 w-12 text-gray-400" />
              <p className="mt-2 text-gray-500">
                {searchTerm || statusFilter !== 'all' 
                  ? 'No tickets found matching your filters.' 
                  : 'No ticket history available for the selected period.'}
              </p>
            </div>
          ) : (
            <div className="divide-y">
              {filteredTickets.map((ticket) => (
                <div key={ticket.id} className="p-6 hover:bg-gray-50 transition-colors">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                      <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-[#0033A0] to-[#1A237E] text-white">
                        {getStatusIcon(ticket.status)}
                      </div>
                      <div>
                        <div className="flex items-center gap-3">
                          <h3 className="text-lg font-semibold text-gray-900">{ticket.ticket_number}</h3>
                          {ticket.priority_level > 0 && (
                            <Badge variant="destructive" className="text-xs">Priority</Badge>
                          )}
                        </div>
                        <div className="flex items-center gap-4 mt-1 text-sm text-gray-500">
                          <span>{ticket.service?.name}</span>
                          {ticket.customer_name && (
                            <div className="flex items-center gap-1">
                              <User className="h-4 w-4" />
                              {ticket.customer_name}
                            </div>
                          )}
                          {ticket.counter && (
                            <span>Counter: {ticket.counter.name}</span>
                          )}
                          {ticket.staff && profile?.role !== 'staff' && (
                            <span>By: {ticket.staff.name}</span>
                          )}
                          <div className="flex items-center gap-1">
                            <Calendar className="h-4 w-4" />
                            {new Date(ticket.ended_at || ticket.created_at).toLocaleDateString()}
                          </div>
                          <div className="flex items-center gap-1">
                            <Clock className="h-4 w-4" />
                            {new Date(ticket.ended_at || ticket.created_at).toLocaleTimeString()}
                          </div>
                        </div>
                        {ticket.notes && (
                          <p className="mt-2 text-sm text-gray-600 bg-gray-50 rounded p-2">{ticket.notes}</p>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="text-right text-sm text-gray-500">
                        <div>Wait: {formatDuration(ticket.wait_time)}</div>
                        {ticket.service_time > 0 && (
                          <div>Service: {formatDuration(ticket.service_time)}</div>
                        )}
                      </div>
                      {getStatusBadge(ticket.status)}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}