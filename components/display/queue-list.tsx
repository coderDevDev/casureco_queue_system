'use client';

import { Card } from '@/components/ui/card';
import { TicketWithDetails, Counter } from '@/types/queue';
import { Monitor, Loader2 } from 'lucide-react';

interface QueueListProps {
  tickets: TicketWithDetails[];
  counters: Counter[];
  loading?: boolean;
}

export function QueueList({ tickets, counters, loading = false }: QueueListProps) {
  // Show top 6 tickets to fill the space nicely
  const displayTickets = tickets.slice(0, 6);

  return (
    <div className="flex h-full flex-col">
      {/* Header */}
      <div className="mb-6 flex-shrink-0">
        <h2 className="text-4xl font-bold text-gray-900
        text-[#0033A0]
        ">Now Serving</h2>
    <div
  className="mt-2 h-1 w-24 rounded-full
             bg-gradient-to-r from-blue-500 via-blue-600 to-blue-400"
/>

      </div>
      
      {/* Queue List - Fixed height container */}
      <div className="flex-1 space-y-3 overflow-hidden">
        {displayTickets.length === 0 ? (
          <Card className="border-0 bg-white p-8 text-center shadow-lg">
            <Monitor className="mx-auto h-12 w-12 text-gray-300" />
            <p className="mt-4 text-lg font-medium text-gray-500">No tickets being served</p>
          </Card>
        ) : (
          displayTickets.map((ticket) => {
            const counter = counters.find((c) => c.id === ticket.counter_id);
            const counterName = counter?.name || (loading ? 'Loading...' : `Counter ${ticket.counter_id?.slice(-4) || 'Unknown'}`);
            
            return (
              <Card
                key={ticket.id}
                className="group relative overflow-hidden border-0 
                bg-gradient-to-r from-blue-500 to-blue-700 p-3 shadow-xl
                 transition-all duration-500 hover:scale-[1.02] animate-pulse-slow"
              >
                {/* Decorative Elements */}
                <div className="absolute -right-8 -top-8 h-24 w-24 rounded-full bg-yellow-400 opacity-20 blur-2xl" />
                <div className="absolute -left-8 -bottom-8 h-24 w-24 rounded-full bg-white opacity-10 blur-2xl" />
                
                <div className="relative">
                  {/* Priority Label - Top */}
                  {ticket.priority_level === 1 && (
                    <div className="mb-1.5">
                      <span className="inline-block rounded bg-amber-400 px-1.5 py-0.5 text-[10px] font-bold text-amber-900">
                        PRIORITY
                      </span>
                    </div>
                  )}
                  {ticket.priority_level === 2 && (
                    <div className="mb-1.5">
                      <span className="inline-block animate-pulse rounded bg-red-500 px-1.5 py-0.5 text-[10px] font-bold text-white">
                        EMERGENCY
                      </span>
                    </div>
                  )}

                  {/* Main Content */}
                  <div className="flex items-center justify-between gap-3">
                    {/* Left: Ticket Number */}
                    <div>
                      <p className="text-4xl font-black leading-none text-white drop-shadow-lg">
                        {ticket.ticket_number}
                      </p>
                      {ticket.service?.name && (
                        <p className="mt-1 text-xs font-semibold text-white/90 truncate max-w-[140px]">
                          {ticket.service.name}
                        </p>
                      )}
                    </div>
                    
                    {/* Right: Counter */}
                    <div className="flex-shrink-0">
                      <div className="rounded-lg bg-white/25 px-3 py-1.5 backdrop-blur-sm text-center">
                        {loading && !counter ? (
                          <Loader2 className="h-4 w-4 text-white animate-spin mx-auto" />
                        ) : (
                          <Monitor className="h-4 w-4 text-white mx-auto mb-0.5" />
                        )}
                        <p className="text-[10px] font-bold text-white/80">Counter</p>
                        <p className="text-base font-black text-white leading-tight">
                          {counter?.name?.replace('Counter ', '') || counterName.replace('Counter ', '')}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </Card>
            );
          })
        )}
      </div>
      
      {/* Footer info */}
      {displayTickets.length > 0 && tickets.length > 6 && (
        <div className="mt-3 flex-shrink-0 text-center">
          <p className="text-sm font-medium text-gray-600">
            +{tickets.length - 6} more in queue
          </p>
        </div>
      )}
    </div>
  );
}
