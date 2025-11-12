'use client';

import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Service } from '@/types/queue';
import { createTicket } from '@/lib/services/queue-service';
import { Loader2, Clock, Users } from 'lucide-react';
import { toast } from 'sonner';
import { formatDuration } from '@/lib/utils';

interface ServiceSelectionProps {
  services: Service[];
  branchId: string;
  onTicketCreated: (ticket: any) => void;
}

export function ServiceSelection({
  services,
  branchId,
  onTicketCreated,
}: ServiceSelectionProps) {
  const [loading, setLoading] = useState<string | null>(null);

  async function handleSelectService(service: Service) {
    setLoading(service.id);

    try {
      const ticket = await createTicket({
        service_id: service.id,
        branch_id: branchId,
        priority_level: 0,
      });

      if (ticket) {
        toast.success('Ticket created successfully!');
        onTicketCreated({ ...ticket, service });
      } else {
        toast.error('Failed to create ticket');
      }
    } catch (error) {
      toast.error('An error occurred');
    } finally {
      setLoading(null);
    }
  }

  if (services.length === 0) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="text-center">
          <Users className="mx-auto h-16 w-16 text-gray-300" />
          <p className="mt-4 text-xl text-gray-500">No services available</p>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-6xl">
      <div className="mb-12 text-center">
        <h2 className="text-5xl font-bold text-gray-900">
          Select Your Service
        </h2>
        <p className="mt-3 text-xl text-gray-600">Choose a service to get your queue number</p>
      </div>

      <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
        {services.map((service) => (
          <Card
            key={service.id}
            className="group relative overflow-hidden border-0 bg-white shadow-xl transition-all duration-300 hover:shadow-2xl hover:-translate-y-2"
          >
            {/* Gradient Background */}
            <div 
              className="absolute inset-0 opacity-5"
              style={{ backgroundColor: service.color || '#3b82f6' }}
            />
            
            {/* Top Accent Bar */}
            <div 
              className="absolute top-0 left-0 h-2 w-full"
              style={{ backgroundColor: service.color || '#3b82f6' }}
            />
            
            <CardContent className="relative p-8">
              {/* Service Badge */}
              <div className="mb-6 flex items-center justify-between">
                <div className="flex-1">
                  <h3 className="text-3xl font-bold text-gray-900">
                    {service.name}
                  </h3>
                  {service.description && (
                    <p className="mt-2 text-sm text-gray-600">{service.description}</p>
                  )}
                </div>
                <div
                  className="flex h-20 w-20 flex-shrink-0 items-center justify-center rounded-2xl text-4xl font-bold text-white shadow-lg transition-transform duration-300 group-hover:scale-110"
                  style={{ backgroundColor: service.color || '#3b82f6' }}
                >
                  {service.prefix}
                </div>
              </div>

              {/* Service Info */}
              <div className="mb-6 rounded-xl bg-gray-50 p-4">
                <div className="flex items-center gap-2 text-gray-700">
                  <Clock className="h-5 w-5" style={{ color: service.color || '#3b82f6' }} />
                  <span className="font-medium">Estimated Time:</span>
                  <span className="font-bold">{formatDuration(service.avg_service_time || 0)}</span>
                </div>
              </div>

              {/* Get Ticket Button */}
              <Button
                size="lg"
                className="w-full h-16 text-xl font-bold shadow-lg transition-all duration-300 hover:shadow-xl"
                style={{ backgroundColor: service.color || '#3b82f6' }}
                onClick={() => handleSelectService(service)}
                disabled={loading === service.id}
              >
                {loading === service.id ? (
                  <>
                    <Loader2 className="mr-3 h-6 w-6 animate-spin" />
                    Creating Ticket...
                  </>
                ) : (
                  'Get Your Ticket'
                )}
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}