'use client';

import { Clock } from 'lucide-react';
import { useEffect, useState } from 'react';
import { formatDate } from '@/lib/utils';

export function DisplayHeader() {
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  return (
    <header className="border-b bg-white shadow-sm">
      <div className="container mx-auto flex h-20 items-center justify-between px-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">
            {process.env.NEXT_PUBLIC_APP_NAME || 'NAGA Queue System'}
          </h1>
          <p className="text-sm text-gray-500">Queue Management Display</p>
        </div>
        
        <div className="flex items-center gap-3 text-right">
          <Clock className="h-6 w-6 text-gray-400" />
          <div>
            <p className="text-2xl font-bold text-gray-900">
              {currentTime.toLocaleTimeString('en-US', { 
                hour: '2-digit', 
                minute: '2-digit',
                second: '2-digit'
              })}
            </p>
            <p className="text-sm text-gray-500">
              {formatDate(currentTime)}
            </p>
          </div>
        </div>
      </div>
    </header>
  );
}