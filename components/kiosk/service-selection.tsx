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
    <div className="mx-auto max-w-4xl">
      <h2 className="mb-8 text-center text-3xl font-bold text-gray-900">
        Select Your Service
      </h2>

      <div className="grid gap-6 md:grid-cols-2">
        {services.map((service) => (
          <Card
            key={service.id}
            className="cursor-pointer transition-all hover:shadow-xl"
            style={{ borderColor: service.color || '#3b82f6' }}
          >
            <CardContent className="p-8">
              <div className="mb-4 flex items-center justify-between">
                <h3 className="text-2xl font-bold text-gray-900">
                  {service.name}
                </h3>
                <div
                  className="flex h-16 w-16 items-center justify-center rounded-full text-3xl font-bold text-white"
                  style={{ backgroundColor: service.color || '#3b82f6' }}
                >
                  {service.prefix}
                </div>
              </div>

              {service.description && (
                <p className="mb-4 text-gray-600">{service.description}</p>
              )}

              <div className="mb-6 flex items-center gap-4 text-sm text-gray-500">
                <div className="flex items-center gap-1">
                  <Clock className="h-4 w-4" />
                  <span>~{formatDuration(service.avg_service_time || 0)}</span>
                </div>
              </div>

              <Button
                size="lg"
                className="w-full text-lg"
                style={{ backgroundColor: service.color || '#3b82f6' }}
                onClick={() => handleSelectService(service)}
                disabled={loading === service.id}
              >
                {loading === service.id ? (
                  <>
                    <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                    Creating Ticket...
                  </>
                ) : (
                  'Get Ticket'
                )}
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}