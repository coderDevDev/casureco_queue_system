import { createClient } from '@/lib/supabase/client';
import { CreateTicketParams, Ticket, TicketWithDetails, QueueStats, TransferTicketParams } from '@/types/queue';

/**
 * Create a new ticket in the queue
 */
export async function createTicket(params: CreateTicketParams): Promise<Ticket | null> {
  const supabase = createClient();

  try {
    // Get next ticket number from database function
    const { data: ticketNumber, error: numberError } = await supabase.rpc(
      'get_next_ticket_number',
      {
        p_service_id: params.service_id,
        p_branch_id: params.branch_id,
      }
    );

    if (numberError) throw numberError;

    // Get current user (if authenticated)
    const { data: { user } } = await supabase.auth.getUser();

    // Create ticket
    const ticketData: any = {
      ticket_number: ticketNumber,
      service_id: params.service_id,
      branch_id: params.branch_id,
      priority_level: params.priority_level || 0,
      customer_name: params.customer_name,
      customer_phone: params.customer_phone,
      notes: params.notes,
      status: 'waiting',
    };

    // Only add issued_by if user is authenticated
    if (user?.id) {
      ticketData.issued_by = user.id;
    }

    const { data, error } = await supabase
      .from('tickets')
      .insert(ticketData)
      .select()
      .single();

    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error creating ticket:', error);
    return null;
  }
}

/**
 * Get ticket by ID with service and counter details
 */
export async function getTicket(ticketId: string): Promise<TicketWithDetails | null> {
  const supabase = createClient();

  const { data, error } = await supabase
    .from('tickets')
    .select(
      `
      *,
      service:services(*),
      counter:counters!tickets_counter_id_fkey(*)
    `
    )
    .eq('id', ticketId)
    .single();

  if (error) {
    console.error('Error fetching ticket:', error);
    return null;
  }

  return data as TicketWithDetails;
}

/**
 * Get all waiting tickets for a service
 */
export async function getWaitingTickets(
  serviceId: string,
  branchId: string
): Promise<TicketWithDetails[]> {
  const supabase = createClient();

  const { data, error } = await supabase
    .from('tickets')
    .select(
      `
      *,
      service:services(*),
      counter:counters!tickets_counter_id_fkey(*)
    `
    )
    .eq('service_id', serviceId)
    .eq('branch_id', branchId)
    .eq('status', 'waiting')
    .order('priority_level', { ascending: false })
    .order('created_at', { ascending: true });

  if (error) {
    console.error('Error fetching waiting tickets:', error);
    return [];
  }

  return data as TicketWithDetails[];
}

/**
 * Get all tickets for a branch (with filters)
 */
export async function getTickets(
  branchId: string,
  filters?: {
    status?: string;
    serviceId?: string;
    counterId?: string;
    date?: Date;
  }
): Promise<TicketWithDetails[]> {
  const supabase = createClient();

  let query = supabase
    .from('tickets')
    .select(
      `
      *,
      service:services(*),
      counter:counters!tickets_counter_id_fkey(*)
    `
    )
    .eq('branch_id', branchId);

  if (filters?.status) {
    query = query.eq('status', filters.status);
  }

  if (filters?.serviceId) {
    query = query.eq('service_id', filters.serviceId);
  }

  if (filters?.counterId) {
    query = query.eq('counter_id', filters.counterId);
  }

  if (filters?.date) {
    const startOfDay = new Date(filters.date);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(filters.date);
    endOfDay.setHours(23, 59, 59, 999);

    query = query
      .gte('created_at', startOfDay.toISOString())
      .lte('created_at', endOfDay.toISOString());
  }

  query = query.order('created_at', { ascending: false });

  const { data, error } = await query;

  if (error) {
    console.error('Error fetching tickets:', error);
    return [];
  }

  return data as TicketWithDetails[];
}

/**
 * Call next ticket in queue
 */
export async function callNextTicket(
  serviceId: string,
  counterId: string
): Promise<Ticket | null> {
  const supabase = createClient();

  try {
    const params = {
      p_service_id: serviceId || null,
      p_counter_id: counterId,
    };
    
    console.log('🎫 DEBUG: Calling get_next_ticket with params:', params);
    console.log('🎫 DEBUG: Original serviceId:', serviceId, 'Type:', typeof serviceId);
    console.log('🎫 DEBUG: Counter ID:', counterId);
    
    // Pass null for service_id if empty string or falsy - allows counter to serve any service
    const { data, error } = await supabase.rpc('get_next_ticket', params);

    console.log('🎫 DEBUG: RPC Response - data:', data, 'error:', error);

    if (error) {
      console.error('🚨 DEBUG: RPC Error details:', error);
      throw error;
    }

    if (data) {
      console.log('✅ DEBUG: Found ticket ID:', data);
      // Fetch the updated ticket
      const ticket = await getTicket(data);
      console.log('✅ DEBUG: Full ticket data:', ticket);
      return ticket;
    }

    console.log('❌ DEBUG: No ticket returned (data is null)');
    
    // Let's also check what tickets are available
    const { data: allTickets } = await supabase
      .from('tickets')
      .select('id, ticket_number, status, service_id')
      .eq('status', 'waiting')
      .limit(5);
    
    console.log('🔍 DEBUG: Available waiting tickets:', allTickets);
    
    return null;
  } catch (error) {
    console.error('🚨 DEBUG: Error calling next ticket:', error);
    return null;
  }
}

/**
 * Update ticket status
 */
export async function updateTicketStatus(
  ticketId: string,
  status: 'waiting' | 'serving' | 'done' | 'skipped' | 'cancelled',
  updates?: {
    counter_id?: string;
    notes?: string;
  }
): Promise<Ticket | null> {
  const supabase = createClient();

  const updateData: any = { status };

  if (status === 'serving') {
    updateData.started_at = new Date().toISOString();
  } else if (status === 'done' || status === 'cancelled' || status === 'skipped') {
    updateData.ended_at = new Date().toISOString();
    
    // Set served_by to current user when completing/cancelling/skipping ticket
    const { data: { user } } = await supabase.auth.getUser();
    if (user?.id) {
      updateData.served_by = user.id;
    }
  }

  if (updates?.counter_id) {
    updateData.counter_id = updates.counter_id;
  }

  if (updates?.notes) {
    updateData.notes = updates.notes;
  }

  const { data, error } = await supabase
    .from('tickets')
    .update(updateData)
    .eq('id', ticketId)
    .select()
    .single();

  if (error) {
    console.error('Error updating ticket:', error);
    return null;
  }

  return data;
}

/**
 * Transfer ticket to another counter
 */
// export async function transferTicket(
//   ticketId: string,
//   newCounterId: string
// ): Promise<Ticket | null> {
//   const supabase = createClient();

//   const { data, error } = await supabase
//     .from('tickets')
//     .update({
//       counter_id: newCounterId,
//       status: 'waiting',
//     })
//     .eq('id', ticketId)
//     .select()
//     .single();

//   if (error) {
//     console.error('Error transferring ticket:', error);
//     return null;
//   }

//   return data;
// }

/**
 * Get queue position for a ticket
 */
export async function getQueuePosition(ticketId: string): Promise<number | null> {
  const supabase = createClient();

  const { data, error } = await supabase.rpc('get_queue_position', {
    p_ticket_id: ticketId,
  });

  if (error) {
    console.error('Error getting queue position:', error);
    return null;
  }

  return data;
}

/**
 * Calculate estimated wait time
 */
export async function calculateWaitTime(
  serviceId: string,
  branchId: string
): Promise<number> {
  const supabase = createClient();

  const { data, error } = await supabase.rpc('calculate_wait_time', {
    p_service_id: serviceId,
    p_branch_id: branchId,
  });

  if (error) {
    console.error('Error calculating wait time:', error);
    return 0;
  }

  return data || 0;
}

/**
 * Get queue statistics
 */
export async function getQueueStats(
  branchId: string,
  date?: Date
): Promise<QueueStats | null> {
  const supabase = createClient();

  const { data, error } = await supabase.rpc('get_queue_stats', {
    p_branch_id: branchId,
    p_date: date ? date.toISOString().split('T')[0] : undefined,
  });

  if (error) {
    console.error('Error getting queue stats:', error);
    return null;
  }

  return data?.[0] || null;
}

/**
 * Delete/Cancel ticket
 */
export async function cancelTicket(ticketId: string): Promise<boolean> {
  const supabase = createClient();

  const { error } = await supabase
    .from('tickets')
    .update({ status: 'cancelled' })
    .eq('id', ticketId);

  if (error) {
    console.error('Error cancelling ticket:', error);
    return false;
  }

  return true;
}

/**
 * Transfer a waiting ticket to a different counter
 */
export async function transferTicket(
  params: TransferTicketParams
): Promise<{ success: boolean; error?: string }> {
  const supabase = createClient();

  try {
    // 1. Get the ticket to validate
    const { data: ticket, error: fetchError } = await supabase
      .from('tickets')
      .select('*, service:services(id), counter:counters!tickets_counter_id_fkey(id)')
      .eq('id', params.ticket_id)
      .single();

    if (fetchError || !ticket) {
      return { success: false, error: 'Ticket not found' };
    }

    // 2. Validate ticket status (allow waiting or serving)
    if (ticket.status !== 'waiting' && ticket.status !== 'serving') {
      return { success: false, error: 'Can only transfer waiting or serving tickets' };
    }

    // 3. Get target counter to validate
    const { data: targetCounter, error: counterError } = await supabase
      .from('counters')
      .select('id, is_active, branch_id')
      .eq('id', params.target_counter_id)
      .single();

    if (counterError || !targetCounter) {
      return { success: false, error: 'Target counter not found' };
    }

    // 4. Validate counter is active
    if (!targetCounter.is_active) {
      return { success: false, error: 'Target counter is not active' };
    }

    // 5. Validate same branch
    if (targetCounter.branch_id !== ticket.branch_id) {
      return { success: false, error: 'Cannot transfer to counter in different branch' };
    }

    // 6. Update ticket with transfer information
    const updateData: any = {
      preferred_counter_id: params.target_counter_id,
      transfer_reason: params.reason || 'Workload balancing',
      transferred_from_counter_id: ticket.counter_id,
      transferred_at: new Date().toISOString(),
      transferred_by: params.transferred_by,
    };

    // If transferring a serving ticket, reset it to waiting
    // This ensures proper re-announcement and time tracking at the new counter
    if (ticket.status === 'serving') {
      updateData.status = 'waiting';
      updateData.started_at = null; // Reset start time
      updateData.called_at = null; // Reset call time
      // Keep counter_id as is (will be updated when called at new counter)
    }

    const { error: updateError } = await supabase
      .from('tickets')
      .update(updateData)
      .eq('id', params.ticket_id);

    if (updateError) {
      console.error('Error updating ticket:', updateError);
      return { success: false, error: 'Failed to transfer ticket' };
    }

    return { success: true };
  } catch (error) {
    console.error('Error in transferTicket:', error);
    return { success: false, error: 'An unexpected error occurred' };
  }
}