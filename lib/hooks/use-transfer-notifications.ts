'use client';

import { useEffect, useRef } from 'react';
import { TicketWithDetails } from '@/types/queue';
import { toast } from 'sonner';

interface UseTransferNotificationsOptions {
  tickets: TicketWithDetails[];
  currentCounterId?: string;
  enabled?: boolean;
}

/**
 * Hook to detect and notify when tickets are transferred to the current counter
 */
export function useTransferNotifications({
  tickets,
  currentCounterId,
  enabled = true,
}: UseTransferNotificationsOptions) {
  // Track tickets we've already notified about
  const notifiedTicketsRef = useRef<Set<string>>(new Set());
  const previousTicketsRef = useRef<TicketWithDetails[]>([]);

  useEffect(() => {
    if (!enabled || !currentCounterId) return;

    // Find newly transferred tickets
    const currentTransferredTickets = tickets.filter(
      (ticket) =>
        ticket.preferred_counter_id === currentCounterId &&
        ticket.status === 'waiting' &&
        ticket.transferred_at
    );

    // Check for new transfers
    currentTransferredTickets.forEach((ticket) => {
      // Skip if we've already notified about this ticket
      if (notifiedTicketsRef.current.has(ticket.id)) return;

      // Check if this is a new transfer (wasn't in previous tickets or just got transferred)
      const wasInPrevious = previousTicketsRef.current.find((t) => t.id === ticket.id);
      const isNewTransfer = !wasInPrevious || !wasInPrevious.preferred_counter_id;

      if (isNewTransfer) {
        // Mark as notified
        notifiedTicketsRef.current.add(ticket.id);

        // Show notification
        toast.info(
          `Ticket ${ticket.ticket_number} transferred to your counter`,
          {
            description: ticket.transfer_reason || 'Workload balancing',
            duration: 5000,
            action: {
              label: 'View',
              onClick: () => {
                // Scroll to the ticket or highlight it
                const element = document.getElementById(`ticket-${ticket.id}`);
                if (element) {
                  element.scrollIntoView({ behavior: 'smooth', block: 'center' });
                  element.classList.add('ring-2', 'ring-blue-500');
                  setTimeout(() => {
                    element.classList.remove('ring-2', 'ring-blue-500');
                  }, 2000);
                }
              },
            },
          }
        );

        // Play notification sound
        playTransferSound();

        console.log('🔔 Transfer notification:', ticket.ticket_number);
      }
    });

    // Update previous tickets reference
    previousTicketsRef.current = tickets;

    // Cleanup: Remove notified tickets that are no longer in the list
    const currentTicketIds = new Set(tickets.map((t) => t.id));
    notifiedTicketsRef.current.forEach((ticketId) => {
      if (!currentTicketIds.has(ticketId)) {
        notifiedTicketsRef.current.delete(ticketId);
      }
    });
  }, [tickets, currentCounterId, enabled]);
}

/**
 * Play a notification sound for ticket transfer
 */
function playTransferSound() {
  try {
    // Create a simple notification beep using Web Audio API
    const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();

    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);

    // Two-tone notification sound
    oscillator.frequency.value = 800; // Higher pitch for transfer
    oscillator.type = 'sine';

    gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.3);

    oscillator.start(audioContext.currentTime);
    oscillator.stop(audioContext.currentTime + 0.3);

    // Second beep
    setTimeout(() => {
      const oscillator2 = audioContext.createOscillator();
      const gainNode2 = audioContext.createGain();

      oscillator2.connect(gainNode2);
      gainNode2.connect(audioContext.destination);

      oscillator2.frequency.value = 1000;
      oscillator2.type = 'sine';

      gainNode2.gain.setValueAtTime(0.3, audioContext.currentTime);
      gainNode2.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.3);

      oscillator2.start(audioContext.currentTime);
      oscillator2.stop(audioContext.currentTime + 0.3);
    }, 150);
  } catch (error) {
    console.error('Error playing transfer sound:', error);
  }
}