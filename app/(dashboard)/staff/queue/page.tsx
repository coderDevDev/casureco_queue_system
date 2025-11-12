'use client';

import { useState, useEffect } from 'react';
import { Phone, User, Clock, CheckCircle, XCircle, SkipForward, Loader2, Users, Ticket } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { useAuth } from '@/lib/hooks/use-auth';
import { formatDuration } from '@/lib/utils';
import { toast } from 'sonner';
import { createClient } from '@/lib/supabase/client';

interface QueueTicket {
  id: string;
  ticket_number: string;
  service_id: string;
  status: 'waiting' | 'serving' | 'completed' | 'cancelled' | 'skipped';
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
  wait_time: number;
}

export default function StaffQueuePage() {
  const { profile } = useAuth();
  const [currentTicket, setCurrentTicket] = useState<QueueTicket | null>(null);
  const [queueTickets, setQueueTickets] = useState<QueueTicket[]>([]);
  const [loading, setLoading] = useState(false);
  const [assignedCounter, setAssignedCounter] = useState<any>(null);
  const [notes, setNotes] = useState('');
  const [stats, setStats] = useState({
    waiting: 0,
    served_today: 0,
    avg_wait_time: 0,
    my_served: 0
  });

  useEffect(() => {
    loadInitialData();
    // Set up real-time updates
    const interval = setInterval(loadQueueData, 3000);
    return () => clearInterval(interval);
  }, []);

  const loadInitialData = async () => {
    await loadCounterAssignment();
    await loadQueueData();
    await loadStats();
  };

  const loadCounterAssignment = async () => {
    const supabase = createClient();
    
    try {
      const { data: counter, error } = await supabase
        .from('counters')
        .select('*')
        .eq('staff_id', profile?.id)
        .eq('is_active', true)
        .single();

      if (error && error.code !== 'PGRST116') {
        console.error('Error loading counter:', error);
        return;
      }

      setAssignedCounter(counter);
    } catch (error) {
      console.error('Error loading counter assignment:', error);
    }
  };

  const loadQueueData = async () => {
    if (!assignedCounter) return;
    
    const supabase = createClient();
    
    try {
      // Get current serving ticket
      const { data: servingTicket } = await supabase
        .from('tickets')
        .select(`
          *,
          service:services(name, prefix, avg_service_time)
        `)
        .eq('counter_id', assignedCounter.id)
        .eq('status', 'serving')
        .single();

      // Get waiting queue for this branch
      const { data: waitingTickets, error } = await supabase
        .from('tickets')
        .select(`
          *,
          service:services(name, prefix, avg_service_time)
        `)
        .eq('branch_id', profile?.branch_id)
        .eq('status', 'waiting')
        .order('priority_level', { ascending: false })
        .order('created_at', { ascending: true })
        .limit(20);

      if (error) throw error;

      // Transform data
      const transformTicket = (ticket: any): QueueTicket => ({
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
        wait_time: Math.floor((Date.now() - new Date(ticket.created_at).getTime()) / 1000)
      });

      setCurrentTicket(servingTicket ? transformTicket(servingTicket) : null);
      setQueueTickets((waitingTickets || []).map(transformTicket));

    } catch (error) {
      console.error('Error loading queue data:', error);
    }
  };

  const loadStats = async () => {
    const supabase = createClient();
    const today = new Date().toISOString().split('T')[0];
    
    try {
      // Get waiting count
      const { count: waitingCount } = await supabase
        .from('tickets')
        .select('*', { count: 'exact', head: true })
        .eq('branch_id', profile?.branch_id)
        .eq('status', 'waiting');

      // Get today's served count by this staff
      const { count: myServedCount } = await supabase
        .from('tickets')
        .select('*', { count: 'exact', head: true })
        .eq('served_by', profile?.id)
        .gte('created_at', today + 'T00:00:00')
        .in('status', ['completed', 'cancelled']);

      // Get total served today
      const { count: totalServedCount } = await supabase
        .from('tickets')
        .select('*', { count: 'exact', head: true })
        .eq('branch_id', profile?.branch_id)
        .gte('created_at', today + 'T00:00:00')
        .in('status', ['completed', 'cancelled']);

      // Calculate average wait time
      const { data: completedTickets } = await supabase
        .from('tickets')
        .select('created_at, called_at')
        .eq('branch_id', profile?.branch_id)
        .gte('created_at', today + 'T00:00:00')
        .eq('status', 'completed')
        .not('called_at', 'is', null);

      let avgWaitTime = 0;
      if (completedTickets && completedTickets.length > 0) {
        const totalWaitTime = completedTickets.reduce((sum, ticket) => {
          const waitTime = new Date(ticket.called_at!).getTime() - new Date(ticket.created_at).getTime();
          return sum + waitTime;
        }, 0);
        avgWaitTime = totalWaitTime / completedTickets.length / 1000 / 60; // Convert to minutes
      }

      setStats({
        waiting: waitingCount || 0,
        served_today: totalServedCount || 0,
        avg_wait_time: Math.round(avgWaitTime),
        my_served: myServedCount || 0
      });
    } catch (error) {
      console.error('Error loading stats:', error);
    }
  };

  const handleCallNext = async () => {
    if (!assignedCounter || currentTicket || queueTickets.length === 0) return;
    
    setLoading(true);
    const supabase = createClient();
    const nextTicket = queueTickets[0];
    
    try {
      const { error } = await supabase
        .from('tickets')
        .update({
          status: 'serving',
          counter_id: assignedCounter.id,
          served_by: profile?.id,
          called_at: new Date().toISOString()
        })
        .eq('id', nextTicket.id);

      if (error) throw error;
      
      toast.success(`Called ticket ${nextTicket.ticket_number}`);
      loadQueueData();
    } catch (error) {
      console.error('Error calling ticket:', error);
      toast.error('Failed to call next ticket');
    } finally {
      setLoading(false);
    }
  };

  const handleCompleteTicket = async () => {
    if (!currentTicket) return;
    
    setLoading(true);
    const supabase = createClient();
    
    try {
      const { error } = await supabase
        .from('tickets')
        .update({
          status: 'completed',
          ended_at: new Date().toISOString(),
          notes: notes || null
        })
        .eq('id', currentTicket.id);

      if (error) throw error;
      
      toast.success('Ticket completed successfully');
      setCurrentTicket(null);
      setNotes('');
      loadQueueData();
      loadStats();
    } catch (error) {
      console.error('Error completing ticket:', error);
      toast.error('Failed to complete ticket');
    } finally {
      setLoading(false);
    }
  };

  const handleSkipTicket = async () => {
    if (!currentTicket) return;
    
    setLoading(true);
    const supabase = createClient();
    
    try {
      const { error } = await supabase
        .from('tickets')
        .update({
          status: 'skipped',
          ended_at: new Date().toISOString(),
          notes: notes || 'Ticket skipped by staff'
        })
        .eq('id', currentTicket.id);

      if (error) throw error;
      
      toast.success('Ticket skipped');
      setCurrentTicket(null);
      setNotes('');
      loadQueueData();
      loadStats();
    } catch (error) {
      console.error('Error skipping ticket:', error);
      toast.error('Failed to skip ticket');
    } finally {
      setLoading(false);
    }
  };

  const serviceTime = currentTicket?.started_at
    ? Math.floor((Date.now() - new Date(currentTicket.started_at).getTime()) / 1000)
    : 0;

  const statCards = [
    {
      title: 'Waiting',
      value: stats.waiting,
      icon: Users,
      color: 'text-blue-600',
      bgColor: 'bg-blue-100',
    },
    {
      title: 'Served Today',
      value: stats.served_today,
      icon: CheckCircle,
      color: 'text-green-600',
      bgColor: 'bg-green-100',
    },
    {
      title: 'Avg Wait',
      value: formatDuration(stats.avg_wait_time),
      icon: Clock,
      color: 'text-yellow-600',
      bgColor: 'bg-yellow-100',
    },
    {
      title: 'Service Time',
      value: formatDuration(serviceTime),
      icon: Ticket,
      color: 'text-purple-600',
      bgColor: 'bg-purple-100',
    },
  ];

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-4xl font-bold text-gray-900">My Queue</h1>
          <p className="mt-2 text-lg text-gray-600">Manage your counter queue - {stats.my_counter}</p>
        </div>
        <Badge className="bg-green-100 text-green-700 hover:bg-green-100 px-4 py-2 text-sm">
          {stats.my_counter} - Active
        </Badge>
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
              <p className="mt-2 text-xs text-gray-500">Current status</p>
            </CardContent>
            
            <div className={`absolute bottom-0 left-0 h-1 w-full ${stat.bgColor}`} />
          </Card>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Current Ticket */}
        <Card className="border-0 shadow-xl overflow-hidden">
          <CardHeader className="bg-gradient-to-r from-[#0033A0] to-[#1A237E] text-white">
            <CardTitle className="text-xl">Current Ticket</CardTitle>
          </CardHeader>
          <CardContent className="bg-gradient-to-br from-blue-50 via-white to-indigo-50 p-6">
            {!currentTicket ? (
              <div className="py-16 text-center">
                <div className="mx-auto mb-4 flex h-20 w-20 items-center justify-center rounded-full bg-gray-100">
                  <User className="h-10 w-10 text-gray-400" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900">No active ticket</h3>
                <p className="mt-2 text-gray-500">Click "Call Next" to serve the next customer</p>
                <Button
                  size="lg"
                  className="mt-8 bg-gradient-to-r from-[#0033A0] to-[#1A237E] hover:from-[#002080] hover:to-[#0d1554]"
                  onClick={handleCallNext}
                  disabled={loading}
                >
                  {loading ? (
                    <>
                      <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                      Calling...
                    </>
                  ) : (
                    <>
                      <Phone className="mr-2 h-5 w-5" />
                      Call Next
                    </>
                  )}
                </Button>
              </div>
            ) : (
              <div className="space-y-6">
                {/* Ticket Number Display */}
                <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-[#0033A0] to-[#1A237E] p-8 text-center shadow-lg">
                  <div className="absolute -right-10 -top-10 h-40 w-40 rounded-full bg-yellow-400 opacity-20 blur-3xl" />
                  <p className="relative text-sm font-semibold uppercase tracking-wide text-yellow-400">Now Serving</p>
                  <p className="relative mt-3 text-6xl font-black text-white drop-shadow-lg">
                    {currentTicket.ticket_number}
                  </p>
                </div>

                {/* Ticket Details */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-500">Service</span>
                    <span className="font-medium">{currentTicket.service_name}</span>
                  </div>
                  {currentTicket.customer_name && (
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-500">Customer</span>
                      <span className="font-medium">{currentTicket.customer_name}</span>
                    </div>
                  )}
                  {currentTicket.customer_phone && (
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-500">Phone</span>
                      <span className="font-medium">{currentTicket.customer_phone}</span>
                    </div>
                  )}
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-500">Service Time</span>
                    <div className="flex items-center gap-2">
                      <Clock className="h-4 w-4 text-gray-400" />
                      <span className="font-medium">{formatDuration(serviceTime)}</span>
                    </div>
                  </div>
                  {currentTicket.priority_level > 0 && (
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-500">Priority</span>
                      <Badge variant="destructive">High Priority</Badge>
                    </div>
                  )}
                  {currentTicket.notes && (
                    <div className="rounded-lg bg-gray-50 p-3">
                      <p className="text-sm text-gray-600">{currentTicket.notes}</p>
                    </div>
                  )}
                </div>

                {/* Action Buttons */}
                <div className="grid grid-cols-2 gap-3">
                  <Button
                    size="lg"
                    onClick={handleCompleteTicket}
                    disabled={loading}
                    className="bg-green-600 hover:bg-green-700"
                  >
                    <CheckCircle className="mr-2 h-5 w-5" />
                    Complete
                  </Button>
                  <Button
                    size="lg"
                    variant="outline"
                    onClick={handleSkipTicket}
                    disabled={loading}
                  >
                    <SkipForward className="mr-2 h-5 w-5" />
                    Skip
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Queue List */}
        <Card className="border-0 shadow-xl overflow-hidden">
          <CardHeader className="bg-gradient-to-r from-[#0033A0] to-[#1A237E] text-white">
            <CardTitle className="flex items-center justify-between">
              <span className="text-xl">Waiting Queue</span>
              <Badge className="bg-yellow-400 text-[#0033A0] hover:bg-yellow-400">
                <Users className="mr-1 h-4 w-4" />
                {queueTickets.length}
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent className="bg-gradient-to-br from-blue-50 via-white to-indigo-50 p-6">
            {queueTickets.length === 0 ? (
              <div className="py-16 text-center">
                <div className="mx-auto mb-4 flex h-20 w-20 items-center justify-center rounded-full bg-gray-100">
                  <Users className="h-10 w-10 text-gray-400" />
                </div>
                <p className="text-lg font-medium text-gray-500">No tickets in queue</p>
              </div>
            ) : (
              <div className="space-y-3">
                {queueTickets.map((ticket, index) => (
                  <div
                    key={ticket.id}
                    className="group flex items-center justify-between rounded-xl border-2 border-gray-200 bg-white p-4 transition-all duration-200 hover:border-[#0033A0] hover:shadow-md"
                  >
                    <div className="flex items-center gap-4">
                      <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-[#0033A0] to-[#1A237E] text-sm font-bold text-white shadow-md">
                        {index + 1}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <p className="text-lg font-bold text-gray-900">{ticket.ticket_number}</p>
                          {ticket.priority_level > 0 && (
                            <Badge variant="destructive" className="text-xs">Priority</Badge>
                          )}
                        </div>
                        <p className="text-sm text-gray-500">{ticket.service_name}</p>
                        {ticket.customer_name && (
                          <p className="text-xs text-gray-400">{ticket.customer_name}</p>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-2 rounded-lg bg-blue-50 px-3 py-2">
                      <Clock className="h-4 w-4 text-blue-600" />
                      <span className="text-sm font-medium text-blue-900">{formatDuration(ticket.wait_time)}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}