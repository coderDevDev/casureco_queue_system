import { Database } from './database';

export type Ticket = Database['public']['Tables']['tickets']['Row'];
export type TicketInsert = Database['public']['Tables']['tickets']['Insert'];
export type TicketUpdate = Database['public']['Tables']['tickets']['Update'];

export type Service = Database['public']['Tables']['services']['Row'];
export type Counter = Database['public']['Tables']['counters']['Row'];
export type Branch = Database['public']['Tables']['branches']['Row'];

export interface QueueStats {
  total_tickets: number;
  waiting_tickets: number;
  serving_tickets: number;
  completed_tickets: number;
  avg_wait_time: number;
  avg_service_time: number;
  active_counters: number;
}

export interface TicketWithDetails extends Ticket {
  service?: Service;
  counter?: Counter;
}

export interface CreateTicketParams {
  service_id: string;
  branch_id: string;
  priority_level?: number;
  customer_name?: string;
  customer_phone?: string;
  notes?: string;
}

export interface TransferTicketParams {
  ticket_id: string;
  target_counter_id: string;
  reason?: string;
  transferred_by: string;
}