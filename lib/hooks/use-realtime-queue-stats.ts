'use client';

import { useEffect, useState } from 'react';
import { getQueueStats } from '@/lib/services/queue-service';
import { QueueStats } from '@/types/queue';
import { createClient } from '@/lib/supabase/client';
import { RealtimeChannel } from '@supabase/supabase-js';

export function useRealtimeQueueStats(branchId: string) {
  const [stats, setStats] = useState<QueueStats | null>(null);
  const [loading, setLoading] = useState(true);

  const supabase = createClient();

  useEffect(() => {
    // Don't fetch if branchId is empty
    if (!branchId) {
      setLoading(false);
      return;
    }

    let channel: RealtimeChannel;
    let intervalId: NodeJS.Timeout;

    async function fetchStats() {
      const data = await getQueueStats(branchId);
      setStats(data);
      setLoading(false);
    }

    function setupRealtimeSubscription() {
      // Listen to ticket changes to trigger stats refresh
      channel = supabase
        .channel('stats-updates')
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'tickets',
            filter: `branch_id=eq.${branchId}`,
          },
          () => {
            fetchStats();
          }
        )
        .subscribe();

      // Also refresh stats every 30 seconds
      intervalId = setInterval(fetchStats, 30000);
    }

    fetchStats();
    setupRealtimeSubscription();

    return () => {
      if (channel) {
        supabase.removeChannel(channel);
      }
      if (intervalId) {
        clearInterval(intervalId);
      }
    };
  }, [branchId, supabase]);

  return { stats, loading };
}