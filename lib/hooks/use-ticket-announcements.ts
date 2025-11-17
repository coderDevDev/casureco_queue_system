import { useEffect, useRef } from 'react';
import { ttsService } from '@/lib/services/tts-service';
import { TicketWithDetails } from '@/types/queue';

export function useTicketAnnouncements(
  tickets: TicketWithDetails[],
  enabled: boolean = true
) {
  const previousTicketsRef = useRef<Set<string>>(new Set());

  useEffect(() => {
    if (!enabled) return;

    // Find newly serving tickets
    const servingTickets = tickets.filter(t => t.status === 'serving');
    
    servingTickets.forEach(ticket => {
      // Check if this ticket was just called (not announced before)
      if (!previousTicketsRef.current.has(ticket.id)) {
        console.log('🔊 New ticket called:', ticket.ticket_number);
        
        // Announce the ticket
        ttsService.announceTicket(
          ticket.ticket_number,
          ticket.counter?.name || 'Counter'
        ).catch(error => {
          console.error('🔊 Announcement failed:', error);
        });
        
        // Mark as announced
        previousTicketsRef.current.add(ticket.id);
      }
    });

    // Clean up old tickets from tracking
    const servingIds = new Set(servingTickets.map(t => t.id));
    previousTicketsRef.current.forEach(id => {
      if (!servingIds.has(id)) {
        previousTicketsRef.current.delete(id);
      }
    });
  }, [tickets, enabled]);

  return {
    isSupported: ttsService.isSupported(),
    stop: () => ttsService.stop(),
  };
}