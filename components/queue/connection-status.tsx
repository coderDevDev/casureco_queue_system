'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Wifi, WifiOff } from 'lucide-react';
import { cn } from '@/lib/utils';

export function ConnectionStatus() {
  const [isConnected, setIsConnected] = useState(true);
  const [isReconnecting, setIsReconnecting] = useState(false);

  const supabase = createClient();

  useEffect(() => {
    const channel = supabase.channel('connection-status');

    channel
      .on('system', {}, (payload) => {
        if (payload.event === 'connected') {
          setIsConnected(true);
          setIsReconnecting(false);
        } else if (payload.event === 'disconnected') {
          setIsConnected(false);
        } else if (payload.event === 'reconnecting') {
          setIsReconnecting(true);
        }
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  if (isConnected && !isReconnecting) {
    return null; // Don't show anything when connected
  }

  return (
    <div
      className={cn(
        'fixed bottom-4 right-4 z-50 flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium shadow-lg',
        isReconnecting
          ? 'bg-yellow-500 text-yellow-950'
          : 'bg-red-500 text-white'
      )}
    >
      {isConnected ? (
        <>
          <Wifi className="h-4 w-4 animate-pulse" />
          <span>Reconnecting...</span>
        </>
      ) : (
        <>
          <WifiOff className="h-4 w-4" />
          <span>Offline</span>
        </>
      )}
    </div>
  );
}