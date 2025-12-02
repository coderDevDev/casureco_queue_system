import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';

export default async function Home() {
  const supabase = await createClient();

  // Check if user is authenticated
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // If not authenticated, redirect to login
  if (!user) {
    redirect('/login');
  }

  // Get user profile to check role
  const { data: profile } = await supabase
    .from('users')
    .select('role')
    .eq('id', user.id)
    .single();

  // Redirect based on role
  if (profile?.role === 'admin' || profile?.role === 'supervisor') {
    redirect('/admin');
  } else if (profile?.role === 'staff') {
    redirect('/staff');
  } else {
    // Default fallback - redirect to kiosk for unknown roles
    redirect('/kiosk');
  }
}
