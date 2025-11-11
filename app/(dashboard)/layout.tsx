import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { StaffHeader } from '@/components/staff/staff-header';

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  // Get user profile
  const { data: profile } = await supabase
    .from('users')
    .select('*')
    .eq('id', user.id)
    .single();

  if (!profile || !profile.is_active) {
    redirect('/login');
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <StaffHeader profile={profile} />
      <main className="container mx-auto px-4 py-6">{children}</main>
    </div>
  );
}