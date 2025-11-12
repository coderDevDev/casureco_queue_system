'use client';

import { useState } from 'react';
import { Phone, User, Clock, CheckCircle, XCircle, SkipForward, Loader2 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { TicketWithDetails, Counter } from '@/types/queue';
import { callNextTicket, updateTicketStatus } from '@/lib/services/queue-service';
import { formatDuration } from '@/lib/utils';
import { toast } from 'sonner';

interface CurrentTicketProps {
  ticket?: TicketWithDetails;
  counter: Counter;
}

export function CurrentTicket({ ticket, counter }: CurrentTicketProps) {
  const [loading, setLoading] = useState(false);
  const [showSkipDialog, setShowSkipDialog] = useState(false);
  const [showCancelDialog, setShowCancelDialog] = useState(false);

  async function handleCallNext() {
    setLoading(true);
    try {
      // Call next ticket for any service (counter handles all services)
      const nextTicket = await callNextTicket('', counter.id);
      
      if (nextTicket) {
        toast.success(`Called ticket ${nextTicket.ticket_number}`);
      } else {
        toast.info('No tickets in queue');
      }
    } catch (error) {
      toast.error('Failed to call next ticket');
    } finally {
      setLoading(false);
    }
  }

  async function handleComplete() {
    if (!ticket) return;

    setLoading(true);
    try {
      await updateTicketStatus(ticket.id, 'done');
      toast.success('Ticket completed');
      
      // Automatically call next ticket
      setTimeout(() => {
        handleCallNext();
      }, 500);
    } catch (error) {
      toast.error('Failed to complete ticket');
    } finally {
      setLoading(false);
    }
  }

  async function handleSkip() {
    if (!ticket) return;

    setLoading(true);
    try {
      await updateTicketStatus(ticket.id, 'skipped');
      toast.info('Ticket skipped');
      setShowSkipDialog(false);
      
      // Automatically call next ticket
      setTimeout(() => {
        handleCallNext();
      }, 500);
    } catch (error) {
      toast.error('Failed to skip ticket');
    } finally {
      setLoading(false);
    }
  }

  async function handleCancel() {
    if (!ticket) return;

    setLoading(true);
    try {
      await updateTicketStatus(ticket.id, 'cancelled');
      toast.info('Ticket cancelled');
      setShowCancelDialog(false);
    } catch (error) {
      toast.error('Failed to cancel ticket');
    } finally {
      setLoading(false);
    }
  }

  const serviceTime = ticket?.started_at
    ? Math.floor((Date.now() - new Date(ticket.started_at).getTime()) / 1000)
    : 0;

  return (
    <>
      <Card className="border-0 shadow-xl overflow-hidden">
        <CardHeader className="">
          <CardTitle className="flex items-center justify-between">
            <span className="text-xl text-[#0033A0]">Current Ticket</span>
            <Badge className="bg-yellow-400 text-[#0033A0] hover:bg-yellow-400">{counter.name}</Badge>
          </CardTitle>
        </CardHeader>
        <CardContent className="bg-gradient-to-br from-blue-50 via-white to-indigo-50 p-6">
          {!ticket ? (
            <div className="py-16 text-center">
              <div className="mx-auto mb-4 flex h-20 w-20 items-center justify-center rounded-full bg-gray-100">
                <User className="h-10 w-10 text-gray-400" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900">No active ticket</h3>
              <p className="mt-2 text-gray-500">
                Click "Call Next" to serve the next customer
              </p>
              <Button
                size="lg"
                className="mt-8 bg-gradient-to-r from-[#0033A0] to-[#1A237E] hover:from-[#002080] hover:to-[#0d1554]"
                onClick={handleCallNext}
                disabled={loading}
              >
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                    Calling...
                  </>
                ) : (
                  <>
                    <Phone className="mr-2 h-5 w-5" />
                    Call Next
                  </>
                )}
              </Button>
            </div>
          ) : (
            <div className="space-y-6">
              {/* Ticket Number Display */}
              <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-[#0033A0] to-[#1A237E] p-8 text-center shadow-lg">
                <div className="absolute -right-10 -top-10 h-40 w-40 rounded-full bg-yellow-400 opacity-20 blur-3xl" />
                <p className="relative text-sm font-semibold uppercase tracking-wide text-yellow-400">Now Serving</p>
                <p className="relative mt-3 text-6xl font-black text-white drop-shadow-lg">
                  {ticket.ticket_number}
                </p>
              </div>

              {/* Ticket Details */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-500">Service</span>
                  <span className="font-medium">{ticket.service?.name}</span>
                </div>

                {ticket.customer_name && (
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-500">Customer</span>
                    <span className="font-medium">{ticket.customer_name}</span>
                  </div>
                )}

                {ticket.customer_phone && (
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-500">Phone</span>
                    <span className="font-medium">{ticket.customer_phone}</span>
                  </div>
                )}

                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-500">Service Time</span>
                  <div className="flex items-center gap-2">
                    <Clock className="h-4 w-4 text-gray-400" />
                    <span className="font-medium">{formatDuration(serviceTime)}</span>
                  </div>
                </div>

                {ticket.priority_level > 0 && (
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-500">Priority</span>
                    <Badge variant="destructive">High Priority</Badge>
                  </div>
                )}

                {ticket.notes && (
                  <div className="rounded-lg bg-gray-50 p-3">
                    <p className="text-sm text-gray-600">{ticket.notes}</p>
                  </div>
                )}
              </div>

              {/* Action Buttons */}
              <div className="grid grid-cols-2 gap-3">
                <Button
                  size="lg"
                  onClick={handleComplete}
                  disabled={loading}
                  className="bg-green-600 hover:bg-green-700"
                >
                  <CheckCircle className="mr-2 h-5 w-5" />
                  Complete
                </Button>

                <Button
                  size="lg"
                  variant="outline"
                  onClick={() => setShowSkipDialog(true)}
                  disabled={loading}
                >
                  <SkipForward className="mr-2 h-5 w-5" />
                  Skip
                </Button>

                <Button
                  size="lg"
                  variant="destructive"
                  onClick={() => setShowCancelDialog(true)}
                  disabled={loading}
                  className="col-span-2"
                >
                  <XCircle className="mr-2 h-5 w-5" />
                  Cancel Ticket
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Skip Confirmation Dialog */}
      <AlertDialog open={showSkipDialog} onOpenChange={setShowSkipDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Skip this ticket?</AlertDialogTitle>
            <AlertDialogDescription>
              The ticket will be moved to the end of the queue. The next ticket will be
              called automatically.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleSkip} disabled={loading}>
              {loading ? 'Skipping...' : 'Skip Ticket'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Cancel Confirmation Dialog */}
      <AlertDialog open={showCancelDialog} onOpenChange={setShowCancelDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Cancel this ticket?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. The ticket will be marked as cancelled and
              removed from the queue.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Go Back</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleCancel}
              disabled={loading}
              className="bg-red-600 hover:bg-red-700"
            >
              {loading ? 'Cancelling...' : 'Cancel Ticket'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}