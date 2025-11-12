'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useRealtimeTickets } from '@/lib/hooks/use-realtime-tickets';
import { Users, Clock } from 'lucide-react';

interface WaitingListProps {
  branchId: string;
}

export function WaitingList({ branchId }: WaitingListProps) {
  const { tickets } = useRealtimeTickets({
    branchId,
    status: 'waiting', // Only fetch waiting tickets
  });

  const waitingTickets = tickets.slice(0, 10); // Show only next 10

  return (
    <Card className="border-0 bg-white shadow-xl">
      <CardHeader className="border-b bg-gradient-to-r from-gray-50 to-white">
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="rounded-xl bg-[#0033A0] p-2.5">
              <Clock className="h-6 w-6 text-white" />
            </div>
            <span className="text-3xl font-bold text-gray-900">Waiting Queue</span>
          </div>
          <Badge className="bg-[#FFD100] text-[#0033A0] text-xl px-4 py-2 hover:bg-[#FFD100]">
            <Users className="mr-2 h-5 w-5" />
            {tickets.length}
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="p-8">
        {waitingTickets.length === 0 ? (
          <div className="py-12 text-center">
            <Users className="mx-auto h-16 w-16 text-gray-300" />
            <p className="mt-4 text-xl font-medium text-gray-500">No tickets waiting</p>
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5">
            {waitingTickets.map((ticket, index) => (
              <div
                key={ticket.id}
                className="group relative overflow-hidden rounded-2xl border-2 border-gray-200 bg-gradient-to-br from-white to-gray-50 p-5 text-center transition-all duration-300 hover:border-[#0033A0] hover:shadow-lg hover:-translate-y-1"
              >
                {/* Position Badge */}
                <div className="absolute right-2 top-2">
                  <div className="flex h-7 w-7 items-center justify-center rounded-full bg-[#0033A0] text-xs font-bold text-white">
                    {index + 1}
                  </div>
                </div>
                
                {/* Ticket Number */}
                <p className="text-4xl font-black text-gray-900 mb-2">
                  {ticket.ticket_number}
                </p>
                
                {/* Service Name */}
                <div className="rounded-lg bg-blue-50 px-3 py-1.5">
                  <p className="text-sm font-semibold text-[#0033A0] truncate">
                    {ticket.service?.name}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}