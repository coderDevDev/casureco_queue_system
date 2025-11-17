'use client';

import { Clock, Users, User, AlertCircle } from 'lucide-react';
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
    <Card className="border-0 shadow-xl overflow-hidden">
      <CardHeader className="">
        <CardTitle className="flex items-center justify-between">
          <span className="text-xl">Waiting Queue</span>
          <Badge className="bg-yellow-400 text-[#0033A0] hover:bg-yellow-400">
            <Users className="mr-1 h-4 w-4" />
            {waitingTickets.length}
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="bg-gradient-to-br from-blue-50 via-white to-indigo-50 p-6">
        {waitingTickets.length === 0 ? (
          <div className="py-16 text-center">
            <div className="mx-auto mb-4 flex h-20 w-20 items-center justify-center rounded-full bg-gray-100">
              <Users className="h-10 w-10 text-gray-400" />
            </div>
            <p className="text-lg font-medium text-gray-500">No tickets in queue</p>
          </div>
        ) : (
          <div className="space-y-3">
            {waitingTickets.slice(0, 10).map((ticket, index) => {
              const waitTime = Math.floor(
                (Date.now() - new Date(ticket.created_at).getTime()) / 1000
              );

              return (
                <div
                  key={ticket.id}
                  className="group flex items-center justify-between rounded-xl border-2 border-gray-200 bg-white p-4 transition-all duration-200 hover:border-[#0033A0] hover:shadow-md"
                >
                  <div className="flex items-center gap-4">
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-[#0033A0] to-[#1A237E] text-sm font-bold text-white shadow-md">
                      {index + 1}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <p className="text-lg font-bold text-gray-900">{ticket.ticket_number}</p>
                        {ticket.priority_level === 1 && (
                          <Badge className="bg-amber-500 text-white text-xs">
                            <User className="mr-1 h-3 w-3" />
                            Senior/PWD
                          </Badge>
                        )}
                        {ticket.priority_level === 2 && (
                          <Badge variant="destructive" className="text-xs animate-pulse">
                            <AlertCircle className="mr-1 h-3 w-3" />
                            EMERGENCY
                          </Badge>
                        )}
                      </div>
                      <p className="text-sm text-gray-500">
                        {ticket.service?.name || 'Unknown Service'}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 rounded-lg bg-blue-50 px-3 py-2">
                    <Clock className="h-4 w-4 text-blue-600" />
                    <span className="text-sm font-medium text-blue-900">{formatDuration(waitTime)}</span>
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