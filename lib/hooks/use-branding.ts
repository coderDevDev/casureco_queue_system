import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';

interface BrandingSettings {
  id: string;
  logo_url?: string;
  company_name: string;
  primary_color: string;
  secondary_color: string;
  ticket_header_text: string;
  ticket_footer_text: string;
  show_qr_code: boolean;
  show_logo_on_ticket: boolean;
  ticket_border_color: string;
}

const DEFAULT_BRANDING: BrandingSettings = {
  id: 'default',
  company_name: process.env.NEXT_PUBLIC_APP_NAME || 'NAGA Queue System',
  primary_color: '#2563EB',
  secondary_color: '#1E40AF',
  ticket_header_text: 'Please keep your ticket',
  ticket_footer_text: 'Thank you for your patience',
  show_qr_code: true,
  show_logo_on_ticket: true,
  ticket_border_color: '#2563EB',
};

export function useBranding() {
  const [branding, setBranding] = useState<BrandingSettings>(DEFAULT_BRANDING);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchBranding();

    // Subscribe to changes
    const supabase = createClient();
    const channel = supabase
      .channel('branding_changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'branding_settings',
        },
        () => {
          fetchBranding();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const fetchBranding = async () => {
    try {
      const supabase = createClient();
      const { data, error } = await supabase
        .from('branding_settings')
        .select('*')
        .single();

      if (error && error.code !== 'PGRST116') {
        console.error('Error fetching branding:', error);
        setBranding(DEFAULT_BRANDING);
      } else if (data) {
        setBranding(data);
      } else {
        setBranding(DEFAULT_BRANDING);
      }
    } catch (error) {
      console.error('Error fetching branding:', error);
      setBranding(DEFAULT_BRANDING);
    } finally {
      setLoading(false);
    }
  };

  return { branding, loading };
}
