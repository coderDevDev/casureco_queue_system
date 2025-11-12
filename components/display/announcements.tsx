'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { createClient } from '@/lib/supabase/client';
import { AlertCircle, Info, AlertTriangle } from 'lucide-react';

interface Announcement {
  id: string;
  title: string;
  message: string;
  type: 'info' | 'warning' | 'alert';
  is_active: boolean;
}

interface AnnouncementsProps {
  branchId: string;
}

export function Announcements({ branchId }: AnnouncementsProps) {
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const supabase = createClient();

  useEffect(() => {
    if (!branchId) return;

    async function fetchAnnouncements() {
      const { data } = await supabase
        .from('announcements')
        .select('*')
        .eq('branch_id', branchId)
        .eq('is_active', true)
        .order('created_at', { ascending: false });

      if (data) {
        setAnnouncements(data as Announcement[]);
      }
    }

    fetchAnnouncements();

    // Subscribe to changes
    const channel = supabase
      .channel('announcements-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'announcements',
          filter: `branch_id=eq.${branchId}`,
        },
        () => {
          fetchAnnouncements();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [branchId, supabase]);

  if (announcements.length === 0) return null;

  const getIcon = (type: string) => {
    switch (type) {
      case 'warning':
        return <AlertTriangle className="h-6 w-6" />;
      case 'alert':
        return <AlertCircle className="h-6 w-6" />;
      default:
        return <Info className="h-6 w-6" />;
    }
  };

  const getColor = (type: string) => {
    switch (type) {
      case 'warning':
        return 'bg-yellow-50 border-yellow-200 text-yellow-900';
      case 'alert':
        return 'bg-red-50 border-red-200 text-red-900';
      default:
        return 'bg-blue-50 border-blue-200 text-blue-900';
    }
  };

  return (
    <div className="space-y-4">
      <div className="mb-8 flex items-center gap-4">
        <h2 className="text-5xl font-bold text-gray-900">Announcements</h2>
        <div className="h-1 flex-1 rounded-full bg-gradient-to-r from-[#FFD100] to-transparent" />
      </div>
      
      {announcements.map((announcement) => (
        <Card
          key={announcement.id}
          className={`border-0 shadow-lg transition-all duration-300 hover:shadow-xl ${getColor(announcement.type)}`}
        >
          <CardContent className="flex items-start gap-4 p-6">
            <div className="flex-shrink-0 rounded-xl bg-white/50 p-3">
              {getIcon(announcement.type)}
            </div>
            <div className="flex-1">
              <h3 className="text-2xl font-bold mb-2">{announcement.title}</h3>
              <p className="text-lg leading-relaxed">{announcement.message}</p>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}