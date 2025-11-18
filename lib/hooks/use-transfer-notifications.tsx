'use client';

import { useEffect, useRef } from 'react';
import { TicketWithDetails } from '@/types/queue';
import { toast } from 'sonner';

interface UseTransferNotificationsOptions {
  tickets: TicketWithDetails[];
  currentCounterId?: string;
  enabled?: boolean;
}

export function useTransferNotifications({
  tickets,
  currentCounterId,
  enabled = true,
}: UseTransferNotificationsOptions) {
  const notifiedTicketsRef = useRef<Set<string>>(new Set());
  const previousTicketsRef = useRef<TicketWithDetails[]>([]);

  useEffect(() => {
    if (!enabled || !currentCounterId) return;

    const currentTransferredTickets = tickets.filter(
      (ticket) =>
        ticket.preferred_counter_id === currentCounterId &&
        ticket.status === 'waiting' &&
        ticket.transferred_at
    );

    currentTransferredTickets.forEach((ticket) => {
      if (notifiedTicketsRef.current.has(ticket.id)) return;

      const wasInPrevious = previousTicketsRef.current.find((t) => t.id === ticket.id);
      const isNewTransfer = !wasInPrevious || !wasInPrevious.preferred_counter_id;

      if (isNewTransfer) {
        notifiedTicketsRef.current.add(ticket.id);

        toast.info(
          `Ticket ${ticket.ticket_number} transferred to your counter`,
          {
            description: ticket.transfer_reason || 'Workload balancing',
            duration: 5000,
            action: {
              label: 'View',
              onClick: () => {
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

        playTransferSound();
        console.log('🔔 Transfer notification:', ticket.ticket_number);
      }
    });

    previousTicketsRef.current = tickets;

    const currentTicketIds = new Set(tickets.map((t) => t.id));
    notifiedTicketsRef.current.forEach((ticketId) => {
      if (!currentTicketIds.has(ticketId)) {
        notifiedTicketsRef.current.delete(ticketId);
      }
    });
  }, [tickets, currentCounterId, enabled]);
}

function playTransferSound() {
  try {
    const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();

    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);

    oscillator.frequency.value = 800;
    oscillator.type = 'sine';

    gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.3);

    oscillator.start(audioContext.currentTime);
    oscillator.stop(audioContext.currentTime + 0.3);

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