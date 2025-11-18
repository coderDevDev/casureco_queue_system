'use client';

import { useState, useEffect } from 'react';
import { ArrowRightLeft, Loader2 } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { TicketWithDetails, Counter } from '@/types/queue';
import { transferTicket } from '@/lib/services/queue-service';
import { createClient } from '@/lib/supabase/client';
import { toast } from 'sonner';

interface TransferTicketDialogProps {
  ticket: TicketWithDetails | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onTransferComplete: () => void;
  currentCounterId?: string;
}

export function TransferTicketDialog({
  ticket,
  open,
  onOpenChange,
  onTransferComplete,
  currentCounterId,
}: TransferTicketDialogProps) {
  const [loading, setLoading] = useState(false);
  const [counters, setCounters] = useState<Counter[]>([]);
  const [selectedCounterId, setSelectedCounterId] = useState<string>('');
  const [reason, setReason] = useState('');

  // Fetch available counters
  useEffect(() => {
    if (open && ticket) {
      fetchCounters();
    }
  }, [open, ticket]);

  async function fetchCounters() {
    if (!ticket) return;

    const supabase = createClient();
    const { data, error } = await supabase
      .from('counters')
      .select(`
        *,
        staff:users!counters_staff_id_fkey(id, name)
      `)
      .eq('branch_id', ticket.branch_id)
      .eq('is_active', true)
      .order('name');

    if (error) {
      console.error('Error fetching counters:', error);
      toast.error('Failed to load counters');
      return;
    }

    // Filter out the current counter if provided
    const availableCounters = currentCounterId
      ? data.filter((c) => c.id !== currentCounterId)
      : data;

    setCounters(availableCounters as any);
  }

  async function handleTransfer() {
    if (!ticket || !selectedCounterId) {
      toast.error('Please select a counter');
      return;
    }

    setLoading(true);

    try {
      // Get current user
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();

      if (!user) {
        toast.error('You must be logged in to transfer tickets');
        return;
      }

      const result = await transferTicket({
        ticket_id: ticket.id,
        target_counter_id: selectedCounterId,
        reason: reason || 'Workload balancing',
        transferred_by: user.id,
      });

      if (result.success) {
        toast.success(`Ticket ${ticket.ticket_number} transferred successfully`);
        onTransferComplete();
        onOpenChange(false);
        // Reset form
        setSelectedCounterId('');
        setReason('');
      } else {
        toast.error(result.error || 'Failed to transfer ticket');
      }
    } catch (error) {
      console.error('Error transferring ticket:', error);
      toast.error('An unexpected error occurred');
    } finally {
      setLoading(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <ArrowRightLeft className="h-5 w-5 text-blue-600" />
            Transfer Ticket
          </DialogTitle>
          <DialogDescription>
            Transfer <strong>{ticket?.ticket_number}</strong> to another counter for workload balancing.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Counter Selection */}
          <div className="space-y-3">
            <Label>Select Target Counter</Label>
            {counters.length === 0 ? (
              <div className="rounded-lg border-2 border-dashed border-gray-300 p-6 text-center">
                <p className="text-sm text-gray-500">No available counters</p>
              </div>
            ) : (
              <RadioGroup value={selectedCounterId} onValueChange={setSelectedCounterId}>
                <div className="space-y-2">
                  {counters.map((counter) => (
                    <div
                      key={counter.id}
                      className={`flex items-center space-x-3 rounded-lg border-2 p-3 transition-colors ${
                        selectedCounterId === counter.id
                          ? 'border-blue-600 bg-blue-50'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <RadioGroupItem value={counter.id} id={counter.id} />
                      <Label
                        htmlFor={counter.id}
                        className="flex-1 cursor-pointer"
                      >
                        <div className="flex flex-col">
                          <span className="font-medium">{counter.name}</span>
                          <span className="text-xs text-gray-500">
                            {(counter as any).staff?.name || 'No staff assigned'}
                          </span>
                        </div>
                        {counter.is_paused && (
                          <span className="ml-2 text-xs text-amber-600">(Paused)</span>
                        )}
                      </Label>
                    </div>
                  ))}
                </div>
              </RadioGroup>
            )}
          </div>

          {/* Reason (Optional) */}
          <div className="space-y-2">
            <Label htmlFor="reason">Reason (Optional)</Label>
            <Textarea
              id="reason"
              placeholder="e.g., Workload balancing, Counter issue..."
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              rows={3}
            />
          </div>
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={loading}
          >
            Cancel
          </Button>
          <Button
            onClick={handleTransfer}
            disabled={loading || !selectedCounterId || counters.length === 0}
            className="bg-blue-600 hover:bg-blue-700"
          >
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Transferring...
              </>
            ) : (
              <>
                <ArrowRightLeft className="mr-2 h-4 w-4" />
                Transfer Ticket
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}