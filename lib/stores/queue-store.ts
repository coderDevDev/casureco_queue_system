import { create } from 'zustand';
import { TicketWithDetails, Counter, QueueStats } from '@/types/queue';

interface QueueStore {
  tickets: TicketWithDetails[];
  counters: Counter[];
  stats: QueueStats | null;
  selectedTicket: TicketWithDetails | null;
  
  setTickets: (tickets: TicketWithDetails[]) => void;
  addTicket: (ticket: TicketWithDetails) => void;
  updateTicket: (ticketId: string, updates: Partial<TicketWithDetails>) => void;
  removeTicket: (ticketId: string) => void;
  
  setCounters: (counters: Counter[]) => void;
  updateCounter: (counterId: string, updates: Partial<Counter>) => void;
  
  setStats: (stats: QueueStats | null) => void;
  setSelectedTicket: (ticket: TicketWithDetails | null) => void;
}

export const useQueueStore = create<QueueStore>((set) => ({
  tickets: [],
  counters: [],
  stats: null,
  selectedTicket: null,

  setTickets: (tickets) => set({ tickets }),
  
  addTicket: (ticket) =>
    set((state) => ({
      tickets: [ticket, ...state.tickets],
    })),

  updateTicket: (ticketId, updates) =>
    set((state) => ({
      tickets: state.tickets.map((ticket) =>
        ticket.id === ticketId ? { ...ticket, ...updates } : ticket
      ),
    })),

  removeTicket: (ticketId) =>
    set((state) => ({
      tickets: state.tickets.filter((ticket) => ticket.id !== ticketId),
    })),

  setCounters: (counters) => set({ counters }),

  updateCounter: (counterId, updates) =>
    set((state) => ({
      counters: state.counters.map((counter) =>
        counter.id === counterId ? { ...counter, ...updates } : counter
      ),
    })),

  setStats: (stats) => set({ stats }),
  
  setSelectedTicket: (ticket) => set({ selectedTicket: ticket }),
}));