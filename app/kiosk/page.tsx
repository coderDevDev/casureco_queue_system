'use client';

import { useState, useEffect } from 'react';
import { KioskHeader } from '@/components/kiosk/kiosk-header';
import { ServiceSelection } from '@/components/kiosk/service-selection';
import { TicketPrint } from '@/components/kiosk/ticket-print';
import { Service } from '@/types/queue';
import { createClient } from '@/lib/supabase/client';

export default function KioskPage() {
  const [branchId, setBranchId] = useState<string>('');
  const [services, setServices] = useState<Service[]>([]);
  const [selectedTicket, setSelectedTicket] = useState<any>(null);

  const supabase = createClient();

  useEffect(() => {
    // Get branch ID from URL params or localStorage
    const params = new URLSearchParams(window.location.search);
    const urlBranchId = params.get('branch') || localStorage.getItem('kiosk_branch_id');
    
    if (urlBranchId) {
      setBranchId(urlBranchId);
      localStorage.setItem('kiosk_branch_id', urlBranchId);
    } else {
      // Default to first branch (for demo)
      setBranchId('00000000-0000-0000-0000-000000000001');
    }
  }, []);

  useEffect(() => {
    if (!branchId) return;

    async function fetchServices() {
      const { data } = await supabase
        .from('services')
        .select('*')
        .eq('branch_id', branchId)
        .eq('is_active', true)
        .order('name', { ascending: true });

      if (data) {
        setServices(data as Service[]);
      }
    }

    fetchServices();
  }, [branchId, supabase]);

  function handleTicketCreated(ticket: any) {
    setSelectedTicket(ticket);
  }

  function handleReset() {
    setSelectedTicket(null);
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <KioskHeader />
      
      <main className="container mx-auto px-4 py-8">
        {selectedTicket ? (
          <TicketPrint ticket={selectedTicket} onReset={handleReset} />
        ) : (
          <ServiceSelection
            services={services}
            branchId={branchId}
            onTicketCreated={handleTicketCreated}
          />
        )}
      </main>
    </div>
  );
}