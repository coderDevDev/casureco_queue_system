'use client';

import { useState } from 'react';
import { Clock, Users, User, AlertCircle, ArrowRightLeft, ArrowRight, ArrowLeft, Info } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { TicketWithDetails } from '@/types/queue';
import { formatDuration } from '@/lib/utils';
import { TransferTicketDialog } from './transfer-ticket-dialog';

interface QueueDisplayProps {
  tickets: TicketWithDetails[];
  currentCounterId?: string;
  onTransferComplete?: () => void;
}

export function QueueDisplay({ tickets, currentCounterId, onTransferComplete }: QueueDisplayProps) {
  const [transferDialogOpen, setTransferDialogOpen] = useState(false);
  const [selectedTicket, setSelectedTicket] = useState<TicketWithDetails | null>(null);
  const waitingTickets = tickets.filter((t) => t.status === 'waiting');

  function handleTransferClick(ticket: TicketWithDetails) {
    setSelectedTicket(ticket);
    setTransferDialogOpen(true);
  }

  function handleTransferComplete() {
    onTransferComplete?.();
  }

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
                  id={`ticket-${ticket.id}`}
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
                        {/* Show badge if ticket was transferred TO this counter */}
                        {ticket.preferred_counter_id === currentCounterId && ticket.transferred_from_counter_id && (
                          <Badge className="bg-blue-500 text-white text-xs">
                            <ArrowLeft className="mr-1 h-3 w-3" />
                            Transferred In
                          </Badge>
                        )}
                        {/* Show badge if ticket was transferred FROM this counter */}
                        {ticket.transferred_from_counter_id === currentCounterId && ticket.preferred_counter_id !== currentCounterId && (
                          <Badge className="bg-orange-500 text-white text-xs">
                            <ArrowRight className="mr-1 h-3 w-3" />
                            Transferred Out
                          </Badge>
                        )}
                      </div>
                      <p className="text-sm text-gray-500">
                        {ticket.service?.name || 'Unknown Service'}
                      </p>
                      {/* Show transfer info for tickets transferred from this counter */}
                      {ticket.transferred_from_counter_id === currentCounterId && ticket.preferred_counter_id !== currentCounterId && (
                        <p className="text-xs text-orange-600 italic mt-1">
                          → Sent to another counter
                        </p>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="flex items-center gap-2 rounded-lg bg-blue-50 px-3 py-2">
                      <Clock className="h-4 w-4 text-blue-600" />
                      <span className="text-sm font-medium text-blue-900">{formatDuration(waitTime)}</span>
                    </div>
                    
                    {/* Show info button for transferred tickets */}
                    {(ticket.transferred_from_counter_id || ticket.preferred_counter_id) && ticket.transferred_at && (
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button
                              size="sm"
                              variant="ghost"
                              className="h-8 w-8 p-0 text-gray-500 hover:text-blue-600"
                            >
                              <Info className="h-4 w-4" />
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent className="max-w-xs">
                            <div className="space-y-1 text-xs">
                              <p className="font-semibold">Transfer Details</p>
                              {ticket.transfer_reason && (
                                <p className="text-gray-600">
                                  <span className="font-medium">Reason:</span> {ticket.transfer_reason}
                                </p>
                              )}
                              <p className="text-gray-600">
                                <span className="font-medium">When:</span>{' '}
                                {new Date(ticket.transferred_at).toLocaleString()}
                              </p>
                            </div>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    )}
                    
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleTransferClick(ticket)}
                      className="border-blue-200 text-blue-600 hover:bg-blue-50 hover:text-blue-700"
                    >
                      <ArrowRightLeft className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </CardContent>

      {/* Transfer Dialog */}
      <TransferTicketDialog
        ticket={selectedTicket}
        open={transferDialogOpen}
        onOpenChange={setTransferDialogOpen}
        onTransferComplete={handleTransferComplete}
        currentCounterId={currentCounterId}
      />
    </Card>
  );
}