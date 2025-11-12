'use client';

import { redirect } from 'next/navigation';
import { AdminSidebar } from '@/components/admin/admin-sidebar';
import { AdminHeader } from '@/components/admin/admin-header';
import { useAuth } from '@/lib/hooks/use-auth';
import { useEffect, useState } from 'react';

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { profile, loading } = useAuth();
  const [authorized, setAuthorized] = useState(false);

  useEffect(() => {
    if (!loading) {
      // Check if user is admin or supervisor
      if (!profile || (profile.role !== 'admin' && profile.role !== 'supervisor')) {
        redirect('/staff');
      } else {
        setAuthorized(true);
      }
    }
  }, [profile, loading]);

  if (loading || !authorized) {
    return null;
  }

  return (
    <div className="flex h-screen bg-gradient-to-br from-gray-50 to-blue-50">
      {/* Sidebar */}
      <AdminSidebar />
      
      {/* Main Content */}
      <div className="flex flex-1 flex-col overflow-hidden">
        <AdminHeader profile={profile!} />
        <main className="flex-1 overflow-y-auto p-8">
          <div className="mx-auto max-w-7xl">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}