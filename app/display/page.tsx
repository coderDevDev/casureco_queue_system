'use client';

import { useEffect, useState } from 'react';
import { Monitor } from 'lucide-react';
import { useRealtimeTickets } from '@/lib/hooks/use-realtime-tickets';
import { useRealtimeCounters } from '@/lib/hooks/use-realtime-counters';
import { DisplayHeader } from '@/components/display/display-header';
import { NowServing } from '@/components/display/now-serving';
import { WaitingList } from '@/components/display/waiting-list';
import { Announcements } from '@/components/display/announcements';

export default function DisplayPage() {
  const [branchId, setBranchId] = useState<string>('');

  useEffect(() => {
    // Get branch ID from URL params or localStorage
    const params = new URLSearchParams(window.location.search);
    const urlBranchId = params.get('branch') || localStorage.getItem('display_branch_id');
    
    if (urlBranchId) {
      setBranchId(urlBranchId);
      localStorage.setItem('display_branch_id', urlBranchId);
    } else {
      // Default to first branch (for demo)
      setBranchId('00000000-0000-0000-0000-000000000001');
    }
  }, []);

  const { tickets, loading: ticketsLoading } = useRealtimeTickets({
    branchId,
  });

  const { counters, loading: countersLoading } = useRealtimeCounters(branchId);

  if (!branchId) {
    return (
      <div className="flex h-screen items-center justify-center">
        <Monitor className="h-12 w-12 animate-pulse text-gray-400" />
      </div>
    );
  }

  // Filter tickets for different sections
  const servingTickets = tickets.filter((t) => t.status === 'serving');
  const waitingTickets = tickets.filter((t) => t.status === 'waiting');
  
  console.log(' Display - Total tickets:', tickets.length, 'Serving:', servingTickets.length, 'Waiting:', waitingTickets.length);

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50 to-indigo-50">
      <DisplayHeader />
      
      <main className="container mx-auto px-6 py-10">
        <div className="space-y-12">
          {/* Now Serving Section */}
          <NowServing 
            tickets={servingTickets} 
            counters={counters} 
            loading={countersLoading}
          />
          
          {/* Waiting List */}
          <WaitingList 
            tickets={waitingTickets} 
            loading={ticketsLoading} 
          />
          
          {/* Announcements */}
          <Announcements branchId={branchId} />
        </div>
      </main>
    </div>
  );
}