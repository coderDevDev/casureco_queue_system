'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useRealtimeTickets } from '@/lib/hooks/use-realtime-tickets';
import { Users } from 'lucide-react';

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
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between text-2xl">
          <span>Waiting Queue</span>
          <Badge variant="secondary" className="text-lg">
            <Users className="mr-2 h-5 w-5" />
            {tickets.length}
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent>
        {waitingTickets.length === 0 ? (
          <div className="py-8 text-center text-gray-500">
            <p className="text-lg">No tickets waiting</p>
          </div>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
            {waitingTickets.map((ticket, index) => (
              <div
                key={ticket.id}
                className="rounded-lg border-2 bg-gray-50 p-4 text-center"
              >
                <div className="mb-2 flex items-center justify-center gap-2">
                  <div className="flex h-6 w-6 items-center justify-center rounded-full bg-blue-100 text-xs font-bold text-blue-700">
                    {index + 1}
                  </div>
                </div>
                <p className="text-2xl font-bold text-gray-900">
                  {ticket.ticket_number}
                </p>
                <p className="mt-1 text-sm text-gray-600">
                  {ticket.service?.name}
                </p>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}