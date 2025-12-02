'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { ChevronRight } from 'lucide-react';

interface Announcement {
  id: string;
  title: string;
  message: string;
  type: 'info' | 'warning' | 'alert';
  is_active: boolean;
}

interface ScrollingTickerProps {
  branchId: string;
}

export function ScrollingTicker({ branchId }: ScrollingTickerProps) {
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const supabase = createClient();

  useEffect(() => {
    if (!branchId) return;

    async function fetchAnnouncements() {
      const { data } = await supabase
        .from('announcements')
        .select('*')
        .eq('branch_id', branchId)
        .eq('is_active', true)
        .order('created_at', { ascending: false });

      if (data) {
        setAnnouncements(data as Announcement[]);
      }
    }

    fetchAnnouncements();

    // Subscribe to changes
    const channel = supabase
      .channel('ticker-announcements-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'announcements',
          filter: `branch_id=eq.${branchId}`,
        },
        () => {
          fetchAnnouncements();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [branchId, supabase]);

  // Create ticker text
  const tickerText = announcements.length > 0
    ? announcements.map(a => `${a.title}: ${a.message}`).join(' • ')
    : 'Welcome to CASURECO II Queue Management System • Please wait for your number to be called • Thank you for your patience';

  return (
    <div className="relative overflow-hidden bg-gradient-to-r from-[#0033A0] to-[#1A237E] py-4 shadow-lg">
      {/* Decorative elements */}
      <div className="absolute inset-0 opacity-10">
        <div className="absolute left-0 top-0 h-full w-20 bg-gradient-to-r from-yellow-400 to-transparent" />
        <div className="absolute right-0 top-0 h-full w-20 bg-gradient-to-l from-yellow-400 to-transparent" />
      </div>
      
      <div className="relative flex items-center gap-3 px-4">
        <div className="flex-shrink-0 rounded-lg bg-yellow-400 px-3 py-1.5">
          <ChevronRight className="h-5 w-5 text-[#0033A0]" />
        </div>
        
        <div className="flex-1 overflow-hidden">
          <div className="flex animate-marquee whitespace-nowrap">
            <span className="inline-block text-xl font-semibold text-white px-4">
              {tickerText}
            </span>
            <span className="inline-block text-xl font-semibold text-white px-4">
              {tickerText}
            </span>
            <span className="inline-block text-xl font-semibold text-white px-4">
              {tickerText}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
