'use client';

import { Clock, Zap } from 'lucide-react';
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
    <header className="relative overflow-hidden bg-gradient-to-r from-[#0033A0] to-[#1A237E] shadow-2xl">
      {/* Decorative Elements */}
      <div className="absolute inset-0 opacity-10">
        <div className="absolute right-0 top-0 h-40 w-40 rounded-full bg-yellow-400 blur-3xl" />
        <div className="absolute left-0 bottom-0 h-40 w-40 rounded-full bg-white blur-3xl" />
      </div>
      
      <div className="container relative mx-auto flex h-24 items-center justify-between px-6">
        <div className="flex items-center gap-4">
          <div className="rounded-xl bg-white/10 p-2.5 backdrop-blur-sm">
            <Zap className="h-8 w-8 text-yellow-400" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-white">
              CASURECO II
            </h1>
            <p className="text-sm font-medium text-white/70">Queue Management Display</p>
          </div>
        </div>
        
        <div className="flex items-center gap-4 rounded-2xl bg-white/10 px-6 py-3 backdrop-blur-sm">
          <Clock className="h-7 w-7 text-yellow-400" />
          <div className="text-right">
            <p className="text-3xl font-bold text-white tabular-nums">
              {currentTime.toLocaleTimeString('en-US', { 
                hour: '2-digit', 
                minute: '2-digit',
                second: '2-digit'
              })}
            </p>
            <p className="text-sm font-medium text-white/70">
              {formatDate(currentTime)}
            </p>
          </div>
        </div>
      </div>
    </header>
  );
}