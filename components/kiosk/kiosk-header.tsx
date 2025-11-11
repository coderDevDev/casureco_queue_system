'use client';

import { Ticket } from 'lucide-react';

export function KioskHeader() {
  return (
    <header className="border-b bg-white shadow-sm">
      <div className="container mx-auto flex h-24 items-center justify-center px-4">
        <div className="text-center">
          <div className="flex items-center justify-center gap-3">
            <Ticket className="h-10 w-10 text-blue-600" />
            <h1 className="text-4xl font-bold text-gray-900">
              {process.env.NEXT_PUBLIC_APP_NAME || 'NAGA Queue System'}
            </h1>
          </div>
          <p className="mt-2 text-lg text-gray-600">
            Please select a service to get your ticket
          </p>
        </div>
      </div>
    </header>
  );
}