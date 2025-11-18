'use client';

import { useState, useEffect, useRef } from 'react';
import { CounterSelection } from '@/components/staff/counter-selection';
import { QueueDisplay } from '@/components/staff/queue-display';
import { CurrentTicket } from '@/components/staff/current-ticket';
import { StatsCards } from '@/components/staff/stats-cards';
import { Counter, TicketWithDetails } from '@/types/queue';
import { getCounterByStaff } from '@/lib/services/counter-service';
import { useAuth } from '@/lib/hooks/use-auth';
import { useQueueStore } from '@/lib/stores/queue-store';
import { useTransferNotifications } from '@/lib/hooks/use-transfer-notifications';

export default function StaffDashboard() {
  const { profile } = useAuth();
  const { tickets, stats } = useQueueStore();
  const [counter, setCounter] = useState<Counter | null>(null);
  const [loading, setLoading] = useState(true);
  const [displayedTicket, setDisplayedTicket] = useState<TicketWithDetails | undefined>(undefined);
  const displayedTicketIdRef = useRef<string | null>(null);

  // Enable transfer notifications
  useTransferNotifications({
    tickets,
    currentCounterId: counter?.id,
    enabled: !!counter?.id,
  });

  // Move useEffect before any conditional returns
  useEffect(() => {
    async function checkExistingCounter() {
      if (!profile?.id) return;

      const existingCounter = await getCounterByStaff(profile.id);
      setCounter(existingCounter);
      setLoading(false);
    }

    checkExistingCounter();
  }, [profile?.id]);

  // Add the displayed ticket effect here, before any conditionals
  useEffect(() => {
    if (!counter?.id) return;

    const currentTicket = tickets.find((t) => 
      t.counter_id === counter.id && t.status === 'serving'
    );

    // If we have a new serving ticket (different ID), update immediately
    if (currentTicket && currentTicket.id !== displayedTicketIdRef.current) {
      console.log(' New serving ticket found:', currentTicket.ticket_number);
      setDisplayedTicket(currentTicket);
      displayedTicketIdRef.current = currentTicket.id;
    }
    // If we have the same serving ticket, update it (for real-time changes)
    else if (currentTicket && currentTicket.id === displayedTicketIdRef.current) {
      console.log(' Updating same serving ticket:', currentTicket.ticket_number);
      setDisplayedTicket(currentTicket);
    }
    // If no serving ticket but we have a displayed ticket ID, keep displaying it
    // This allows the auto-call to complete (wait 1.5 seconds)
    else if (!currentTicket && displayedTicketIdRef.current) {
      console.log(' No serving ticket, waiting for auto-call...');
      // DON'T update displayedTicket here - keep the old one visible
      const clearTimer = setTimeout(() => {
        // Check again if there's still no serving ticket
        const stillNoTicket = !tickets.find((t) => 
          t.counter_id === counter.id && t.status === 'serving'
        );
        if (stillNoTicket) {
          console.log(' Clearing displayed ticket after timeout');
          setDisplayedTicket(undefined);
          displayedTicketIdRef.current = null;
        } else {
          console.log(' New ticket found during wait period');
        }
      }, 1500);
      
      return () => clearTimeout(clearTimer);
    }
    // If no serving ticket and no displayed ticket ID, ensure it's cleared
    else if (!currentTicket && !displayedTicketIdRef.current) {
      if (displayedTicket) {
        console.log(' Clearing stale displayed ticket');
        setDisplayedTicket(undefined);
      }
    }
  }, [tickets, counter?.id]); // Only depend on tickets and counter.id

  // Add a separate effect to log changes for debugging
  useEffect(() => {
    console.log(' Displayed ticket changed:', {
      id: displayedTicket?.id,
      number: displayedTicket?.ticket_number,
      status: displayedTicket?.status
    });
  }, [displayedTicket]);

  if (loading) {
    return null;
  }

  if (!counter) {
    return <CounterSelection onCounterAssigned={setCounter} />;
  }

  console.log('🏪 Staff Dashboard - Counter ID:', counter.id);
  console.log('🎫 Total tickets in store:', tickets.length);
  console.log('🎫 Serving tickets:', 
    tickets
      .filter(t => t.status === 'serving')
      .map(t => ({ num: t.ticket_number, counter: t.counter_id }))
  );
  console.log('🎯 Current ticket:', 
    tickets.find(t => t.counter_id === counter.id && t.status === 'serving')?.ticket_number || 'none'
  );
  console.log('🖥️ Displayed ticket:', displayedTicket?.ticket_number || 'none');

  // Handle transfer completion - tickets will auto-refresh via real-time subscription
  function handleTransferComplete() {
    console.log('✅ Ticket transferred successfully');
    // The useQueueStore subscription will automatically update the tickets
  }

  return (
    <div className="space-y-6">
      <StatsCards stats={stats} counter={counter} />
      
      <div className="grid gap-6 lg:grid-cols-2">
        <CurrentTicket key={counter.id} ticket={displayedTicket} counter={counter} />
        <QueueDisplay 
          tickets={tickets} 
          currentCounterId={counter.id}
          onTransferComplete={handleTransferComplete} 
        />
      </div>
    </div>
  );
}