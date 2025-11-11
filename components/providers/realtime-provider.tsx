'use client';

import { useEffect } from 'react';
import { useAuth } from '@/lib/hooks/use-auth';
import { useQueueStore } from '@/lib/stores/queue-store';
import { useRealtimeTickets } from '@/lib/hooks/use-realtime-tickets';
import { useRealtimeCounters } from '@/lib/hooks/use-realtime-counters';
import { useRealtimeQueueStats } from '@/lib/hooks/use-realtime-queue-stats';

export function RealtimeProvider({ children }: { children: React.ReactNode }) {
  const { profile, loading } = useAuth();
  const { setTickets, setCounters, setStats } = useQueueStore();

  // Don't fetch data until profile is loaded and has a valid branch_id
  const branchId = profile?.branch_id || '';
  const shouldFetch = !loading && !!branchId;

  const { tickets, loading: ticketsLoading } = useRealtimeTickets({
    branchId: shouldFetch ? branchId : '',
    // Don't filter by status - get all tickets so staff can see serving tickets
  });

  const { counters, loading: countersLoading } = useRealtimeCounters(
    shouldFetch ? branchId : ''
  );

  const { stats, loading: statsLoading } = useRealtimeQueueStats(
    shouldFetch ? branchId : ''
  );

  useEffect(() => {
    if (shouldFetch && !ticketsLoading) {
      setTickets(tickets);
    }
  }, [tickets, ticketsLoading, setTickets, shouldFetch]);

  useEffect(() => {
    if (shouldFetch && !countersLoading) {
      setCounters(counters);
    }
  }, [counters, countersLoading, setCounters, shouldFetch]);

  useEffect(() => {
    if (shouldFetch && !statsLoading && stats) {
      setStats(stats);
    }
  }, [stats, statsLoading, setStats, shouldFetch]);

  return <>{children}</>;
}