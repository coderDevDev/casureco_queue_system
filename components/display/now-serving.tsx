'use client';

import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { TicketWithDetails, Counter } from '@/types/queue';
import { Monitor } from 'lucide-react';

interface NowServingProps {
  tickets: TicketWithDetails[];
  counters: Counter[];
}

export function NowServing({ tickets, counters }: NowServingProps) {
  return (
    <div>
      <h2 className="mb-6 text-3xl font-bold text-gray-900">Now Serving</h2>
      
      {tickets.length === 0 ? (
        <Card className="p-12 text-center">
          <Monitor className="mx-auto h-16 w-16 text-gray-300" />
          <p className="mt-4 text-xl text-gray-500">No tickets being served</p>
        </Card>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {tickets.map((ticket) => {
            const counter = counters.find((c) => c.id === ticket.counter_id);
            
            return (
              <Card
                key={ticket.id}
                className="animate-pulse-slow border-4 border-blue-500 bg-white p-8 shadow-2xl"
              >
                <div className="text-center">
                  <Badge className="mb-4 text-lg" variant="default">
                    {counter?.name || 'Counter'}
                  </Badge>
                  
                  <div className="my-6">
                    <p className="text-6xl font-bold text-blue-600">
                      {ticket.ticket_number}
                    </p>
                  </div>
                  
                  <p className="text-xl font-medium text-gray-700">
                    {ticket.service?.name}
                  </p>
                </div>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}