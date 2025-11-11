'use client';

import { useState, useEffect } from 'react';
import { CounterSelection } from '@/components/staff/counter-selection';
import { QueueDisplay } from '@/components/staff/queue-display';
import { CurrentTicket } from '@/components/staff/current-ticket';
import { StatsCards } from '@/components/staff/stats-cards';
import { Counter } from '@/types/queue';
import { getCounterByStaff } from '@/lib/services/counter-service';
import { useAuth } from '@/lib/hooks/use-auth';
import { useQueueStore } from '@/lib/stores/queue-store';

export default function StaffDashboard() {
  const { profile } = useAuth();
  const { tickets, stats } = useQueueStore();
  const [counter, setCounter] = useState<Counter | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function checkExistingCounter() {
      if (!profile?.id) return;

      const existingCounter = await getCounterByStaff(profile.id);
      setCounter(existingCounter);
      setLoading(false);
    }

    checkExistingCounter();
  }, [profile?.id]);

  if (loading) {
    return null;
  }

  if (!counter) {
    return <CounterSelection onCounterAssigned={setCounter} />;
  }

  const currentTicket = tickets.find((t) => t.counter_id === counter.id && t.status === 'serving');

  console.log('🏪 Staff Dashboard - Counter ID:', counter.id);
  console.log('🎫 Total tickets in store:', tickets.length);
  console.log('🎫 Serving tickets:', tickets.filter(t => t.status === 'serving').map(t => ({ num: t.ticket_number, counter: t.counter_id })));
  console.log('🎯 Current ticket:', currentTicket?.ticket_number || 'none');

  return (
    <div className="space-y-6">
      <StatsCards stats={stats} counter={counter} />
      
      <div className="grid gap-6 lg:grid-cols-2">
        <CurrentTicket ticket={currentTicket} counter={counter} />
        <QueueDisplay tickets={tickets} />
      </div>
    </div>
  );
}