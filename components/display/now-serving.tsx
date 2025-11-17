'use client';

import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { TicketWithDetails, Counter } from '@/types/queue';
import { Monitor, ArrowRight, Loader2, User, AlertCircle } from 'lucide-react';

interface NowServingProps {
  tickets: TicketWithDetails[];
  counters: Counter[];
  loading?: boolean;
}

export function NowServing({ tickets, counters, loading = false }: NowServingProps) {
  return (
    <div>
      <div className="mb-8 flex items-center gap-4">
        <h2 className="text-5xl font-bold text-gray-900">Now Serving</h2>
        <div className="h-1 flex-1 rounded-full bg-gradient-to-r from-[#0033A0] to-transparent" />
      </div>
      
      {tickets.length === 0 ? (
        <Card className="border-0 bg-white p-16 text-center shadow-xl">
          <Monitor className="mx-auto h-20 w-20 text-gray-300" />
          <p className="mt-6 text-2xl font-medium text-gray-500">No tickets being served</p>
        </Card>
      ) : (
        <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
          {tickets.map((ticket) => {
            const counter = counters.find((c) => c.id === ticket.counter_id);
            const counterName = counter?.name || (loading ? 'Loading...' : `Counter ${ticket.counter_id?.slice(-4) || 'Unknown'}`);
            
            return (
              <Card
                key={ticket.id}
                className="group relative overflow-hidden border-0 bg-gradient-to-br from-[#0033A0] to-[#1A237E] p-10 shadow-2xl transition-all duration-500 hover:scale-105 animate-pulse-slow"
              >
                {/* Decorative Elements */}
                <div className="absolute -right-10 -top-10 h-40 w-40 rounded-full bg-yellow-400 opacity-20 blur-3xl" />
                <div className="absolute -left-10 -bottom-10 h-40 w-40 rounded-full bg-white opacity-10 blur-3xl" />
                
                <div className="relative text-center">
                  {/* Counter Badge */}
                  <div className="mb-6 inline-flex items-center gap-2 rounded-full bg-yellow-400 px-6 py-2">
                    {loading && !counter ? (
                      <Loader2 className="h-5 w-5 text-[#0033A0] animate-spin" />
                    ) : (
                      <Monitor className="h-5 w-5 text-[#0033A0]" />
                    )}
                    <span className="text-lg font-bold text-[#0033A0]">
                      {counterName}
                    </span>
                  </div>
                  
                  {/* Priority Badge */}
                  {ticket.priority_level === 1 && (
                    <div className="mb-4 inline-flex items-center gap-2 rounded-full bg-amber-400 px-5 py-2 shadow-lg">
                      <User className="h-5 w-5 text-amber-900" />
                      <span className="text-base font-bold text-amber-900">
                        Senior / PWD
                      </span>
                    </div>
                  )}
                  {ticket.priority_level === 2 && (
                    <div className="mb-4 inline-flex items-center gap-2 rounded-full bg-red-500 px-5 py-2 shadow-lg animate-pulse">
                      <AlertCircle className="h-5 w-5 text-white" />
                      <span className="text-base font-bold text-white">
                        EMERGENCY
                      </span>
                    </div>
                  )}
                  
                  {/* Ticket Number */}
                  <div className="my-8">
                    <p className="text-8xl font-black text-white drop-shadow-2xl">
                      {ticket.ticket_number}
                    </p>
                  </div>
                  
                  {/* Service Name */}
                  <div className="flex items-center justify-center gap-2 rounded-xl bg-white/10 px-6 py-3 backdrop-blur-sm">
                    <p className="text-2xl font-bold text-white">
                      {ticket.service?.name || 'Service'}
                    </p>
                    <ArrowRight className="h-6 w-6 text-yellow-400 animate-pulse" />
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}