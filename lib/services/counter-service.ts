import { createClient } from '@/lib/supabase/client';
import { Counter } from '@/types/queue';

/**
 * Assign staff to a counter
 */
export async function assignCounter(counterId: string, staffId: string): Promise<Counter | null> {
  const supabase = createClient();

  const { data, error } = await supabase
    .from('counters')
    .update({
      staff_id: staffId,
      is_active: true,
      last_ping: new Date().toISOString(),
    })
    .eq('id', counterId)
    .select()
    .single();

  if (error) {
    console.error('Error assigning counter:', error);
    return null;
  }

  return data;
}

/**
 * Release staff from counter
 */
export async function releaseCounter(counterId: string): Promise<boolean> {
  const supabase = createClient();

  const { error } = await supabase
    .from('counters')
    .update({
      staff_id: null,
      is_active: false,
      current_ticket_id: null,
    })
    .eq('id', counterId);

  if (error) {
    console.error('Error releasing counter:', error);
    return false;
  }

  return true;
}

/**
 * Update counter heartbeat
 */
export async function updateCounterHeartbeat(counterId: string): Promise<boolean> {
  const supabase = createClient();

  const { error } = await supabase.rpc('update_counter_heartbeat', {
    p_counter_id: counterId,
  });

  if (error) {
    console.error('Error updating heartbeat:', error);
    return false;
  }

  return true;
}

/**
 * Get available counters for a branch
 */
export async function getAvailableCounters(branchId: string): Promise<Counter[]> {
  const supabase = createClient();

  const { data, error } = await supabase
    .from('counters')
    .select('*')
    .eq('branch_id', branchId)
    .is('staff_id', null)
    .order('name', { ascending: true });

  if (error) {
    console.error('Error fetching available counters:', error);
    return [];
  }

  return data || [];
}

/**
 * Get counter by staff ID
 */
export async function getCounterByStaff(staffId: string): Promise<Counter | null> {
  const supabase = createClient();

  const { data, error } = await supabase
    .from('counters')
    .select('*')
    .eq('staff_id', staffId)
    .single();

  if (error) {
    return null;
  }

  return data;
}