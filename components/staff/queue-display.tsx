'use client';

import { Clock, Users } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { TicketWithDetails } from '@/types/queue';
import { formatDuration } from '@/lib/utils';

interface QueueDisplayProps {
  tickets: TicketWithDetails[];
}

export function QueueDisplay({ tickets }: QueueDisplayProps) {
  const waitingTickets = tickets.filter((t) => t.status === 'waiting');

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span>Waiting Queue</span>
          <Badge variant="secondary">
            <Users className="mr-1 h-3 w-3" />
            {waitingTickets.length}
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent>
        {waitingTickets.length === 0 ? (
          <div className="py-8 text-center text-gray-500">
            <Users className="mx-auto h-12 w-12 text-gray-300" />
            <p className="mt-2">No tickets in queue</p>
          </div>
        ) : (
          <div className="space-y-2">
            {waitingTickets.slice(0, 10).map((ticket, index) => {
              const waitTime = Math.floor(
                (Date.now() - new Date(ticket.created_at).getTime()) / 1000
              );

              return (
                <div
                  key={ticket.id}
                  className="flex items-center justify-between rounded-lg border p-3"
                >
                  <div className="flex items-center gap-3">
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-100 text-sm font-semibold text-blue-700">
                      {index + 1}
                    </div>
                    <div>
                      <p className="font-semibold">{ticket.ticket_number}</p>
                      <p className="text-sm text-gray-500">
                        {ticket.service?.name || 'Unknown Service'}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-gray-500">
                    <Clock className="h-4 w-4" />
                    <span>{formatDuration(waitTime)}</span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}