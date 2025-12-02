'use client';

import { useEffect, useState } from 'react';
import { Monitor } from 'lucide-react';
import { useRealtimeTickets } from '@/lib/hooks/use-realtime-tickets';
import { useRealtimeCounters } from '@/lib/hooks/use-realtime-counters';
import { DisplayHeader } from '@/components/display/display-header';
import { QueueList } from '@/components/display/queue-list';
import { VideoArea } from '@/components/display/video-area';
import { ScrollingTicker } from '@/components/display/scrolling-ticker';
import { CompactWaitingList } from '@/components/display/compact-waiting-list';
import { useTicketAnnouncements } from '@/lib/hooks/use-ticket-announcements';

export default function DisplayPage() {
  // Initialize branchId from URL or localStorage
  const [branchId, setBranchId] = useState<string>(() => {
    if (typeof window === 'undefined') return '';
    const params = new URLSearchParams(window.location.search);
    const urlBranchId = params.get('branch') || localStorage.getItem('display_branch_id');
    return urlBranchId || '00000000-0000-0000-0000-000000000001';
  });

  useEffect(() => {
    // Save to localStorage when branchId changes
    if (branchId) {
      localStorage.setItem('display_branch_id', branchId);
    }
  }, [branchId]);

  const { tickets } = useRealtimeTickets({
    branchId,
  });

  const { counters, loading: countersLoading } = useRealtimeCounters(branchId);

  // Call all hooks before any conditional returns (Rules of Hooks)
  useTicketAnnouncements(tickets, true);

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
    <div className="flex h-screen flex-col bg-gradient-to-br from-gray-50 via-blue-50 to-indigo-50">
      {/* Header */}
      <DisplayHeader />
      
      {/* Main Split Screen Content */}
      <main className="flex flex-1 overflow-hidden">
        {/* Left Panel - Queue List (35% width) */}
        <div className="w-[35%] overflow-y-auto border-r border-gray-200 bg-white/50 p-6 backdrop-blur-sm">
          <QueueList 
            tickets={servingTickets} 
            counters={counters} 
            loading={countersLoading}
          />
        </div>
        
        {/* Right Panel - Video Area + Waiting List (65% width) */}
        <div className="flex-1 flex flex-col p-1">
          <div className="flex-1 min-h-0">
            <VideoArea branchId={branchId} />
          </div>
          <CompactWaitingList tickets={waitingTickets} />
        </div>
      </main>
      
      {/* Bottom Ticker */}
      <ScrollingTicker branchId={branchId} />
    </div>
  );
}