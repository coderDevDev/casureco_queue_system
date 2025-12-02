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

export default function StaffQueuePage() {
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
    return (
      <div className="flex h-full items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#0033A0]"></div>
      </div>
    );
  }

  if (!counter) {
    return (
      <div className="space-y-8">
        <div>
          <h1 className="text-4xl font-bold text-gray-900">Queue Management</h1>
          <p className="mt-2 text-lg text-gray-600">You need to be assigned to a counter to manage the queue</p>
        </div>
        <CounterSelection onCounterAssigned={setCounter} />
      </div>
    );
  }

  const currentTicket = tickets.find((t) => t.counter_id === counter.id && t.status === 'serving');

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-4xl font-bold text-gray-900">Queue Management System</h1>
          <p className="mt-2 text-lg text-gray-600">Counter: {counter.name}</p>
        </div>
      </div>

      {/* Stats Cards */}
      <StatsCards stats={stats} counter={counter} />
      
      {/* Current Ticket and Queue Display */}
      <div className="grid gap-6 lg:grid-cols-2">
        <CurrentTicket ticket={currentTicket} counter={counter} />
        <QueueDisplay tickets={tickets} />
      </div>
    </div>
  );
}