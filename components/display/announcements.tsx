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
        return <AlertTriangle className="h-5 w-5" />;
      case 'alert':
        return <AlertCircle className="h-5 w-5" />;
      default:
        return <Info className="h-5 w-5" />;
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
    <div className="space-y-3">
      {announcements.map((announcement) => (
        <Card
          key={announcement.id}
          className={`border-2 ${getColor(announcement.type)}`}
        >
          <CardContent className="flex items-start gap-3 p-4">
            {getIcon(announcement.type)}
            <div className="flex-1">
              <h3 className="font-semibold">{announcement.title}</h3>
              <p className="mt-1 text-sm">{announcement.message}</p>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}