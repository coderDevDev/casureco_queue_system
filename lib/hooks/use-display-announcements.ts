import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';

interface Announcement {
  id: string;
  title: string;
  message: string;
  type: 'info' | 'warning' | 'success' | 'error';
  content_type: 'text' | 'video' | 'image' | 'slideshow';
  media_url?: string;
  media_urls?: string[];
  thumbnail_url?: string;
  audio_url?: string;
  enable_tts: boolean;
  tts_voice: string;
  tts_speed: number;
  play_audio_on_display: boolean;
  loop_media: boolean;
  transition_duration: number;
  is_active: boolean;
  display_duration: number;
  priority: number;
  start_date?: string;
  end_date?: string;
}

export function useDisplayAnnouncements(branchId: string) {
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const supabase = createClient();

  useEffect(() => {
    if (!branchId) return;

    async function fetchAnnouncements() {
      const now = new Date().toISOString();
      
      const { data, error } = await supabase
        .from('announcements')
        .select('*')
        .or(`branch_id.eq.${branchId},branch_id.is.null`)
        .eq('is_active', true)
        .or(`start_date.is.null,start_date.lte.${now}`)
        .or(`end_date.is.null,end_date.gte.${now}`)
        .order('priority', { ascending: false })
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching announcements:', error);
      } else {
        setAnnouncements((data as Announcement[]) || []);
      }
      
      setLoading(false);
    }

    fetchAnnouncements();

    // Subscribe to real-time changes
    const channel = supabase
      .channel('display-announcements-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'announcements',
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

  // Auto-rotate announcements
  useEffect(() => {
    if (announcements.length === 0) return;

    const currentAnnouncement = announcements[currentIndex];
    const duration = (currentAnnouncement?.display_duration || 10) * 1000;

    const timer = setTimeout(() => {
      setCurrentIndex((prev) => (prev + 1) % announcements.length);
    }, duration);

    return () => clearTimeout(timer);
  }, [announcements, currentIndex]);

  const currentAnnouncement = announcements.length > 0 ? announcements[currentIndex] : null;

  return {
    announcements,
    currentAnnouncement,
    loading,
    totalCount: announcements.length,
  };
}
