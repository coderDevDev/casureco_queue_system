'use client';

import { Zap } from 'lucide-react';

export function KioskHeader() {
  return (
    <header className="relative overflow-hidden bg-gradient-to-r from-[#0033A0] to-[#1A237E] shadow-2xl">
      {/* Decorative Elements */}
      <div className="absolute inset-0 opacity-10">
        <div className="absolute -right-20 -top-20 h-64 w-64 rounded-full bg-white" />
        <div className="absolute -left-20 -bottom-20 h-64 w-64 rounded-full bg-yellow-400" />
      </div>
      
      <div className="container relative mx-auto flex h-32 items-center justify-center px-4">
        <div className="text-center">
          <div className="flex items-center justify-center gap-4">
            <div className="rounded-2xl bg-white/10 p-3 backdrop-blur-sm">
              <Zap className="h-12 w-12 text-yellow-400" />
            </div>
            <div>
              <h1 className="text-5xl font-bold text-white">
                CASURECO II
              </h1>
              <p className="mt-1 text-sm font-medium text-white/80">
                Queue Management System
              </p>
            </div>
          </div>
        
        </div>
      </div>
    </header>
  );
}