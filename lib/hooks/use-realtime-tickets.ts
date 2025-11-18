'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { TicketWithDetails } from '@/types/queue';
import { RealtimeChannel } from '@supabase/supabase-js';

interface UseRealtimeTicketsOptions {
  branchId: string;
  serviceId?: string;
  status?: string;
}

export function useRealtimeTickets(options: UseRealtimeTicketsOptions) {
  const [tickets, setTickets] = useState<TicketWithDetails[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const supabase = createClient();

  useEffect(() => {
    // Don't fetch if branchId is empty
    if (!options.branchId) {
      setLoading(false);
      return;
    }

    let channel: RealtimeChannel;

    async function fetchInitialTickets() {
      try {
        let query = supabase
          .from('tickets')
          .select(
            `
            *,
            service:services(*),
            counter:counters!tickets_counter_id_fkey(*)
          `
          )
          .eq('branch_id', options.branchId);

        if (options.serviceId) {
          query = query.eq('service_id', options.serviceId);
        }

        if (options.status) {
          query = query.eq('status', options.status);
        }

        query = query.order('created_at', { ascending: false });

        const { data, error } = await query;

        if (error) throw error;

        setTickets((data as TicketWithDetails[]) || []);
      } catch (err) {
        setError(err as Error);
      } finally {
        setLoading(false);
      }
    }

    function setupRealtimeSubscription() {
      const channelName = `tickets-changes-${options.branchId}-${options.serviceId || 'all'}-${options.status || 'all'}`;
      console.log('🔌 Setting up realtime subscription for tickets:', channelName);
      
      channel = supabase
        .channel(channelName)
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'tickets',
            filter: `branch_id=eq.${options.branchId}`,
          },
          async (payload) => {
            console.log('📡 Realtime event received:', payload.eventType, payload);
            if (payload.eventType === 'INSERT') {
              // Fetch full ticket with relations
              const { data } = await supabase
                .from('tickets')
                .select(
                  `
                  *,
                  service:services(*),
                  counter:counters!tickets_counter_id_fkey(*)
                `
                )
                .eq('id', payload.new.id)
                .single();

              if (data) {
                console.log('✅ INSERT: Adding ticket', data.ticket_number);
                setTickets((prev) => [data as TicketWithDetails, ...prev]);
              }
            } else if (payload.eventType === 'UPDATE') {
              // Fetch updated ticket with relations
              const { data } = await supabase
                .from('tickets')
                .select(
                  `
                  *,
                  service:services(*),
                  counter:counters!tickets_counter_id_fkey(*)
                `
                )
                .eq('id', payload.new.id)
                .single();

              if (data) {
                console.log('✅ UPDATE: Updating ticket', data.ticket_number, 'status:', data.status, 'filter:', options.status);
                
                setTickets((prev) => {
                  const existingIndex = prev.findIndex((t) => t.id === data.id);
                  const matchesFilter = !options.status || data.status === options.status;
                  
                  if (matchesFilter) {
                    // Ticket matches filter
                    if (existingIndex >= 0) {
                      // Update existing
                      return prev.map((ticket) =>
                        ticket.id === data.id ? (data as TicketWithDetails) : ticket
                      );
                    } else {
                      // Add new (status changed to match filter)
                      return [data as TicketWithDetails, ...prev];
                    }
                  } else {
                    // Ticket doesn't match filter - remove it
                    if (existingIndex >= 0) {
                      console.log('❌ Removing ticket', data.ticket_number, 'from list (status changed)');
                      return prev.filter((ticket) => ticket.id !== data.id);
                    }
                    return prev;
                  }
                });
              }
            } else if (payload.eventType === 'DELETE') {
              console.log('✅ DELETE: Removing ticket', payload.old.id);
              setTickets((prev) => prev.filter((ticket) => ticket.id !== payload.old.id));
            }
          }
        )
        .subscribe((status, err) => {
          console.log('📊 Subscription status:', status);
          if (status === 'SUBSCRIBED') {
            console.log('✅ Successfully subscribed to realtime updates!');
          } else if (status === 'CHANNEL_ERROR') {
            console.error('❌ Realtime subscription error!');
            console.error('🔍 Error details:', err);
            console.error('🔍 Channel name:', channelName);
            console.error('🔍 Branch ID:', options.branchId);
            console.error('🔍 Service ID:', options.serviceId);
            console.error('🔍 Status filter:', options.status);
            
            // Try to reconnect after a delay
            setTimeout(() => {
              console.log('🔄 Attempting to reconnect...');
              setupRealtimeSubscription();
            }, 5000);
          } else if (status === 'TIMED_OUT') {
            console.error('⏱️ Realtime subscription timed out!');
            console.error('🔍 Channel name:', channelName);
            
            // Try to reconnect after a delay
            setTimeout(() => {
              console.log('🔄 Attempting to reconnect after timeout...');
              setupRealtimeSubscription();
            }, 3000);
          } else {
            console.log('🔍 Other subscription status:', status, err);
          }
        });
    }

    fetchInitialTickets();
    setupRealtimeSubscription();

    return () => {
      if (channel) {
        supabase.removeChannel(channel);
      }
    };
  }, [options.branchId, options.serviceId, options.status, supabase]);

  return { tickets, loading, error };
}