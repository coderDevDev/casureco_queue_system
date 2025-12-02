'use client';

import { Card } from '@/components/ui/card';
import { TicketWithDetails } from '@/types/queue';
import { Clock, User, AlertCircle } from 'lucide-react';

interface CompactWaitingListProps {
  tickets: TicketWithDetails[];
}

export function CompactWaitingList({ tickets }: CompactWaitingListProps) {
  // Show only next 5 waiting tickets
  const displayTickets = tickets.slice(0, 5);

  if (displayTickets.length === 0) {
    return null;
  }

  return (
    <div className="mt-6">
      {/* Header */}
      <div className="mb-4 flex items-center gap-3">
        <div className="rounded-xl bg-[#0033A0] p-2">
          <Clock className="h-5 w-5 text-white" />
        </div>
        <h3 className="text-2xl font-bold text-gray-900">Up Next</h3>
        <div className="ml-auto flex items-center gap-2 rounded-full bg-gradient-to-r from-[#FFD100] to-[#FFC700] px-4 py-2 shadow-md">
          <span className="text-lg font-black text-[#0033A0]">{tickets.length}</span>
          <span className="text-sm font-semibold text-[#0033A0]">waiting</span>
        </div>
      </div>
      
      {/* Compact Grid */}
      <div className="grid grid-cols-5 gap-3">
        {displayTickets.map((ticket, index) => (
          <Card
            key={ticket.id}
            className="group relative overflow-hidden border-0 bg-gradient-to-br from-blue-100 to-indigo-100 p-4 text-center shadow-lg transition-all duration-300 hover:scale-105 hover:shadow-xl"
          >
            {/* Position Badge */}
            <div className="absolute right-2 top-2">
              <div className="flex h-6 w-6 items-center justify-center rounded-full bg-gradient-to-br from-[#0033A0] to-[#1A237E] text-xs font-bold text-white shadow-md">
                {index + 1}
              </div>
            </div>
            
            {/* Priority Badge */}
            {ticket.priority_level === 1 && (
              <div className="absolute left-2 top-2">
                <div className="flex h-6 w-6 items-center justify-center rounded-full bg-amber-400 shadow-md">
                  <User className="h-3.5 w-3.5 text-amber-900" />
                </div>
              </div>
            )}
            {ticket.priority_level === 2 && (
              <div className="absolute left-2 top-2">
                <div className="flex h-6 w-6 items-center justify-center rounded-full bg-red-500 shadow-md animate-pulse">
                  <AlertCircle className="h-3.5 w-3.5 text-white" />
                </div>
              </div>
            )}

            {/* Ticket Number */}
            <p className="text-3xl font-black text-[#0033A0] mb-2 drop-shadow-sm">
              {ticket.ticket_number}
            </p>

            {/* Service Name */}
            {ticket.service?.name && (
              <div className="rounded-lg bg-white/70 px-2 py-1 backdrop-blur-sm">
                <p className="text-xs font-semibold text-gray-700 truncate">
                  {ticket.service.name}
                </p>
              </div>
            )}
          </Card>
        ))}
      </div>
      
      {/* More indicator */}
      {tickets.length > 5 && (
        <div className="mt-3 text-center">
          <span className="inline-flex items-center gap-2 rounded-full bg-gray-100 px-4 py-1.5 text-sm font-semibold text-gray-700">
            <span>+{tickets.length - 5} more in queue</span>
          </span>
        </div>
      )}
    </div>
  );
}
