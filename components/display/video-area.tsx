'use client';

import { DynamicContentDisplay } from './dynamic-content-display';
import { useDisplayAnnouncements } from '@/lib/hooks/use-display-announcements';

interface VideoAreaProps {
  branchId: string;
}

export function VideoArea({ branchId }: VideoAreaProps) {
  const { currentAnnouncement, loading } = useDisplayAnnouncements(branchId);

  if (loading) {
    return (
      <div className="relative h-full w-full overflow-hidden rounded-2xl bg-gradient-to-br from-gray-900 to-gray-800 shadow-2xl flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white"></div>
      </div>
    );
  }

  return <DynamicContentDisplay announcement={currentAnnouncement} />;
}
