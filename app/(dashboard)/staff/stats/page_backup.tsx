'use client';

import { useState, useEffect } from 'react';
import { Clock, CheckCircle, XCircle, SkipForward, Search, Calendar, User, Ticket, ArrowUpDown, ChevronLeft, ChevronRight } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useAuth } from '@/lib/hooks/use-auth';
import { formatDuration } from '@/lib/utils';
import { createClient } from '@/lib/supabase/client';

interface HistoryTicket {
  id: string;
  ticket_number: string;
  service_id: string;
  status: 'done' | 'cancelled' | 'skipped';
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
  const [sortField, setSortField] = useState<'ticket_number' | 'service_time' | 'wait_time' | 'ended_at'>('ended_at');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [stats, setStats] = useState({
    completed: 0,
    cancelled: 0,
    skipped: 0,
    avg_service_time: 0
  });

  useEffect(() => {
    if (profile) {
      fetchHistory();
    }
  }, [dateFilter, profile]);

  const fetchHistory = async () => {
    const supabase = createClient();
    setLoading(true);

    try {
      // Wait for profile to be loaded
      if (!profile) {
        setLoading(false);
        return;
      }
      // Calculate date range
      const startDate = new Date();
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
          counter:counters!tickets_counter_id_fkey(name),
          staff:users!tickets_served_by_fkey(name)
        `)
        .in('status', ['done', 'cancelled', 'skipped'])
        .or(`ended_at.gte.${startDate.toISOString()},created_at.gte.${startDate.toISOString()}`)
        .order('ended_at', { ascending: false, nullsFirst: false })
        .order('created_at', { ascending: false });

      // Filter by staff if not admin/supervisor
      if (profile.role === 'staff') {
        query = query.eq('served_by', profile.id);
      } else {
        // For admin/supervisor, show branch tickets
        if (profile.branch_id) {
          query = query.eq('branch_id', profile.branch_id);
        } else {
          // If no branch_id, don't show any tickets
          setTickets([]);
          setStats({ completed: 0, cancelled: 0, skipped: 0, avg_service_time: 0 });
          setLoading(false);
          return;
        }
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
      const completed = transformedTickets.filter(t => t.status === 'done').length;
      const cancelled = transformedTickets.filter(t => t.status === 'cancelled').length;
      const skipped = transformedTickets.filter(t => t.status === 'skipped').length;
      const completedTickets = transformedTickets.filter(t => t.status === 'done');
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

  // Sort tickets
  const sortedTickets = [...filteredTickets].sort((a, b) => {
    let aValue: string | number = '';
    let bValue: string | number = '';

    switch (sortField) {
      case 'ticket_number':
        aValue = a.ticket_number.toLowerCase();
        bValue = b.ticket_number.toLowerCase();
        break;
      case 'service_time':
        aValue = a.service_time;
        bValue = b.service_time;
        break;
      case 'wait_time':
        aValue = a.wait_time;
        bValue = b.wait_time;
        break;
      case 'ended_at':
        aValue = new Date(a.ended_at || a.created_at).getTime();
        bValue = new Date(b.ended_at || b.created_at).getTime();
        break;
    }

    if (aValue < bValue) return sortDirection === 'asc' ? -1 : 1;
    if (aValue > bValue) return sortDirection === 'asc' ? 1 : -1;
    return 0;
  });

  // Pagination
  const totalPages = Math.ceil(sortedTickets.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedTickets = sortedTickets.slice(startIndex, endIndex);

  const handleSort = (field: 'ticket_number' | 'service_time' | 'wait_time' | 'ended_at') => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
    setCurrentPage(1);
  };

  // Reset to first page when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, statusFilter]);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'done':
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
      case 'done':
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
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50 p-2">
      {/* Clean Header Section */}
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-4xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent">
              Ticket History
            </h1>
            <p className="text-gray-600 mt-2">
              View your completed tickets and performance
            </p>
          </div>
          <Select value={dateFilter} onValueChange={setDateFilter}>
            <SelectTrigger className="w-40 bg-white shadow-md">
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

      {/* Enhanced Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        {statCards.map((stat, index) => (
          <Card
            key={stat.title}
            className="group relative overflow-hidden border-0 bg-white shadow-md hover:shadow-xl transition-all duration-400 hover:-translate-y-1 rounded-xl animate-fade-in-up"
            style={{ animationDelay: `${index * 100}ms` }}
          >
            <div className={`absolute top-0 left-0 right-0 h-1 bg-gradient-to-r ${stat.bgColor} ${stat.color.replace('text-', 'from-')} to-transparent`} />
            <div className={`absolute inset-0 bg-gradient-to-br ${stat.bgColor} opacity-0 group-hover:opacity-10 transition-opacity duration-500`} />

            <CardContent className="relative p-4">
              <div className="flex items-start justify-between mb-2">
                <div className={`rounded-xl p-2.5 ${stat.bgColor} transition-all duration-400 group-hover:scale-105 shadow`}>
                  <stat.icon className={`h-5 w-5 ${stat.color}`} />
                </div>

                <div className="text-right leading-tight">
                  <div className="text-3xl font-bold bg-gradient-to-br from-gray-900 to-gray-600 bg-clip-text text-transparent mb-0.5 group-hover:scale-105 transition-transform duration-300">
                    {stat.value}
                  </div>
                </div>
              </div>

              <div>
                <p className="text-xs font-bold text-gray-800">{stat.title}</p>
                <p className="text-[10px] text-gray-500">{dateFilter === 'today' ? 'Today' : dateFilter === 'week' ? 'This week' : 'This month'}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* History Table with Integrated Filters */}
      <Card className="bg-white/80 backdrop-blur-xl border border-white/50 shadow-lg overflow-hidden">
        <CardHeader className="border-b border-gray-200 bg-white/50 backdrop-blur-sm space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-xl font-bold text-gray-900">Ticket History</CardTitle>
              <p className="text-sm text-gray-600 mt-1">
                Showing {startIndex + 1}-{Math.min(endIndex, sortedTickets.length)} of {sortedTickets.length} ticket{sortedTickets.length !== 1 ? 's' : ''}
              </p>
            </div>
            <Select value={itemsPerPage.toString()} onValueChange={(value) => {
              setItemsPerPage(Number(value));
              setCurrentPage(1);
            }}>
              <SelectTrigger className="w-32">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="5">5 per page</SelectItem>
                <SelectItem value="10">10 per page</SelectItem>
                <SelectItem value="20">20 per page</SelectItem>
                <SelectItem value="50">50 per page</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          {/* Search Bar and Status Filter */}
          <div className="flex items-center gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
              <Input
                placeholder="Search by ticket number, customer name, or service..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 border-gray-200 focus:border-blue-500 focus:ring-blue-500/20"
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-40">
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="done">Completed</SelectItem>
                <SelectItem value="cancelled">Cancelled</SelectItem>
                <SelectItem value="skipped">Skipped</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {sortedTickets.length === 0 ? (
            <div className="p-8 text-center">
              <Ticket className="mx-auto h-12 w-12 text-gray-400" />
              <p className="mt-2 text-gray-500">
                {searchTerm || statusFilter !== 'all' 
                  ? 'No tickets found matching your filters.' 
                  : 'No ticket history available for the selected period.'}
              </p>
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-gray-50 hover:bg-gray-50">
                      <TableHead className="w-12">#</TableHead>
                      <TableHead>
                        <Button
                          variant="ghost"
                          onClick={() => handleSort('ticket_number')}
                          className="flex items-center gap-1 hover:bg-transparent p-0 h-auto font-semibold"
                        >
                          Ticket #
                          <ArrowUpDown className="h-4 w-4" />
                        </Button>
                      </TableHead>
                      <TableHead>Service</TableHead>
                      <TableHead>Customer</TableHead>
                      <TableHead>Counter</TableHead>
                      {profile?.role !== 'staff' && <TableHead>Staff</TableHead>}
                      <TableHead>
                        <Button
                          variant="ghost"
                          onClick={() => handleSort('wait_time')}
                          className="flex items-center gap-1 hover:bg-transparent p-0 h-auto font-semibold"
                        >
                          Wait Time
                          <ArrowUpDown className="h-4 w-4" />
                        </Button>
                      </TableHead>
                      <TableHead>
                        <Button
                          variant="ghost"
                          onClick={() => handleSort('service_time')}
                          className="flex items-center gap-1 hover:bg-transparent p-0 h-auto font-semibold"
                        >
                          Service Time
                          <ArrowUpDown className="h-4 w-4" />
                        </Button>
                      </TableHead>
                      <TableHead>
                        <Button
                          variant="ghost"
                          onClick={() => handleSort('ended_at')}
                          className="flex items-center gap-1 hover:bg-transparent p-0 h-auto font-semibold"
                        >
                          Completed At
                          <ArrowUpDown className="h-4 w-4" />
                        </Button>
                      </TableHead>
                      <TableHead>Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {paginatedTickets.map((ticket, index) => (
                      <TableRow key={ticket.id} className="hover:bg-gray-50">
                        <TableCell className="font-medium text-gray-500">
                          {startIndex + index + 1}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <div className="font-semibold text-gray-900">{ticket.ticket_number}</div>
                            {ticket.priority_level > 0 && (
                              <Badge variant="destructive" className="text-xs">Priority</Badge>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <span className="text-sm text-gray-700">{ticket.service?.name || '-'}</span>
                        </TableCell>
                        <TableCell>
                          {ticket.customer_name ? (
                            <div className="flex items-center gap-1 text-sm text-gray-700">
                              <User className="h-4 w-4" />
                              {ticket.customer_name}
                            </div>
                          ) : (
                            <span className="text-gray-400 text-sm">-</span>
                          )}
                        </TableCell>
                        <TableCell>
                          <span className="text-sm text-gray-700">{ticket.counter?.name || '-'}</span>
                        </TableCell>
                        {profile?.role !== 'staff' && (
                          <TableCell>
                            <span className="text-sm text-gray-700">{ticket.staff?.name || '-'}</span>
                          </TableCell>
                        )}
                        <TableCell>
                          <span className="text-sm text-gray-600">{formatDuration(ticket.wait_time)}</span>
                        </TableCell>
                        <TableCell>
                          <span className="text-sm text-gray-600">
                            {ticket.service_time > 0 ? formatDuration(ticket.service_time) : '-'}
                          </span>
                        </TableCell>
                        <TableCell>
                          <div className="text-sm text-gray-600">
                            <div>{new Date(ticket.ended_at || ticket.created_at).toLocaleDateString()}</div>
                            <div className="text-xs text-gray-500">
                              {new Date(ticket.ended_at || ticket.created_at).toLocaleTimeString()}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          {getStatusBadge(ticket.status)}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              {/* Pagination Controls */}
              {totalPages > 1 && (
                <div className="flex items-center justify-between border-t border-gray-200 bg-white px-6 py-4">
                  <div className="text-sm text-gray-600">
                    Page {currentPage} of {totalPages}
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                      disabled={currentPage === 1}
                      className="h-8"
                    >
                      <ChevronLeft className="h-4 w-4 mr-1" />
                      Previous
                    </Button>
                    
                    <div className="flex items-center gap-1">
                      {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                        let pageNum;
                        if (totalPages <= 5) {
                          pageNum = i + 1;
                        } else if (currentPage <= 3) {
                          pageNum = i + 1;
                        } else if (currentPage >= totalPages - 2) {
                          pageNum = totalPages - 4 + i;
                        } else {
                          pageNum = currentPage - 2 + i;
                        }
                        
                        return (
                          <Button
                            key={pageNum}
                            variant={currentPage === pageNum ? "default" : "outline"}
                            size="sm"
                            onClick={() => setCurrentPage(pageNum)}
                            className="h-8 w-8 p-0"
                          >
                            {pageNum}
                          </Button>
                        );
                      })}
                    </div>

                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                      disabled={currentPage === totalPages}
                      className="h-8"
                    >
                      Next
                      <ChevronRight className="h-4 w-4 ml-1" />
                    </Button>
                  </div>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
