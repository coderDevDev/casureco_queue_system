'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Counter } from '@/types/queue';
import { RealtimeChannel } from '@supabase/supabase-js';

export function useRealtimeCounters(branchId: string) {
  const [counters, setCounters] = useState<Counter[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const supabase = createClient();

  useEffect(() => {
    // Don't fetch if branchId is empty
    if (!branchId) {
      setLoading(false);
      return;
    }

    let channel: RealtimeChannel;

    async function fetchInitialCounters() {
      try {
        const { data, error } = await supabase
          .from('counters')
          .select('*')
          .eq('branch_id', branchId)
          .order('name', { ascending: true });

        if (error) throw error;

        setCounters(data || []);
      } catch (err) {
        setError(err as Error);
      } finally {
        setLoading(false);
      }
    }

    function setupRealtimeSubscription() {
      channel = supabase
        .channel('counters-changes')
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'counters',
            filter: `branch_id=eq.${branchId}`,
          },
          (payload) => {
            if (payload.eventType === 'INSERT') {
              setCounters((prev) => [...prev, payload.new as Counter]);
            } else if (payload.eventType === 'UPDATE') {
              setCounters((prev) =>
                prev.map((counter) =>
                  counter.id === payload.new.id ? (payload.new as Counter) : counter
                )
              );
            } else if (payload.eventType === 'DELETE') {
              setCounters((prev) => prev.filter((counter) => counter.id !== payload.old.id));
            }
          }
        )
        .subscribe();
    }

    fetchInitialCounters();
    setupRealtimeSubscription();

    return () => {
      if (channel) {
        supabase.removeChannel(channel);
      }
    };
  }, [branchId, supabase]);

  return { counters, loading, error };
}