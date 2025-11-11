'use client';

import { useEffect, useState, useRef } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { CheckCircle, Printer, Home } from 'lucide-react';
import { formatDate, formatDuration } from '@/lib/utils';
import { getQueuePosition, calculateWaitTime } from '@/lib/services/queue-service';

interface TicketPrintProps {
  ticket: any;
  onReset: () => void;
}

export function TicketPrint({ ticket, onReset }: TicketPrintProps) {
  const [queuePosition, setQueuePosition] = useState<number | null>(null);
  const [estimatedWait, setEstimatedWait] = useState<number>(0);
  const [countdown, setCountdown] = useState(15);
  const printRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    async function fetchQueueInfo() {
      const position = await getQueuePosition(ticket.id);
      const waitTime = await calculateWaitTime(ticket.service_id, ticket.branch_id);
      
      setQueuePosition(position);
      setEstimatedWait(waitTime);
    }

    fetchQueueInfo();
  }, [ticket]);

  useEffect(() => {
    // Auto-reset after 15 seconds
    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          onReset();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [onReset]);

  function handlePrint() {
    window.print();
  }

  return (
    <div className="mx-auto max-w-2xl">
      <div className="mb-8 text-center">
        <CheckCircle className="mx-auto h-20 w-20 text-green-500" />
        <h2 className="mt-4 text-3xl font-bold text-gray-900">
          Ticket Created Successfully!
        </h2>
        <p className="mt-2 text-gray-600">
          Please keep your ticket and wait for your number to be called
        </p>
      </div>

      <Card className="mb-6 border-4 border-blue-500 shadow-2xl" ref={printRef}>
        <CardContent className="p-8">
          {/* Ticket Header */}
          <div className="border-b-2 border-dashed pb-6 text-center">
            <h3 className="text-xl font-semibold text-gray-700">
              {process.env.NEXT_PUBLIC_APP_NAME || 'NAGA Queue System'}
            </h3>
            <p className="text-sm text-gray-500">{formatDate(new Date())}</p>
          </div>

          {/* Ticket Number */}
          <div className="my-8 text-center">
            <p className="text-lg font-medium text-gray-600">Your Ticket Number</p>
            <p className="mt-2 text-7xl font-bold text-blue-600">
              {ticket.ticket_number}
            </p>
          </div>

          {/* Service Info */}
          <div className="space-y-4 border-t-2 border-dashed pt-6">
            <div className="flex justify-between">
              <span className="text-gray-600">Service:</span>
              <span className="font-semibold">{ticket.service?.name}</span>
            </div>

            {queuePosition !== null && (
              <div className="flex justify-between">
                <span className="text-gray-600">Queue Position:</span>
                <span className="font-semibold">{queuePosition}</span>
              </div>
            )}

            {estimatedWait > 0 && (
              <div className="flex justify-between">
                <span className="text-gray-600">Estimated Wait:</span>
                <span className="font-semibold">{formatDuration(estimatedWait)}</span>
              </div>
            )}

            <div className="flex justify-between">
              <span className="text-gray-600">Time Issued:</span>
              <span className="font-semibold">
                {new Date(ticket.created_at).toLocaleTimeString()}
              </span>
            </div>
          </div>

          {/* QR Code Placeholder */}
          <div className="mt-6 border-t-2 border-dashed pt-6 text-center">
            <div className="mx-auto h-32 w-32 rounded-lg bg-gray-100 flex items-center justify-center">
              <span className="text-xs text-gray-400">QR Code</span>
            </div>
            <p className="mt-2 text-xs text-gray-500">
              Scan to check status
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Action Buttons */}
      <div className="grid gap-4 sm:grid-cols-2">
        <Button
          size="lg"
          variant="outline"
          onClick={handlePrint}
          className="text-lg"
        >
          <Printer className="mr-2 h-5 w-5" />
          Print Ticket
        </Button>

        <Button
          size="lg"
          onClick={onReset}
          className="text-lg"
        >
          <Home className="mr-2 h-5 w-5" />
          Done ({countdown}s)
        </Button>
      </div>
    </div>
  );
}