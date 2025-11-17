'use client';

import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Service } from '@/types/queue';
import { createTicket } from '@/lib/services/queue-service';
import { Loader2, Clock, Users, User, AlertCircle, ArrowLeft } from 'lucide-react';
import { toast } from 'sonner';
import { formatDuration } from '@/lib/utils';

interface ServiceSelectionProps {
  services: Service[];
  branchId: string;
  onTicketCreated: (ticket: any) => void;
}

const priorityOptions = [
  {
    level: 0,
    title: 'Regular Customer',
    description: 'Standard queue service',
    icon: Users,
    color: '#3b82f6',
    bgColor: 'bg-blue-50',
    hoverColor: 'hover:bg-blue-100',
  },
  {
    level: 1,
    title: 'Senior Citizen / PWD',
    description: 'Priority lane for senior citizens and persons with disabilities',
    icon: User,
    color: '#f59e0b',
    bgColor: 'bg-amber-50',
    hoverColor: 'hover:bg-amber-100',
  },
  {
    level: 2,
    title: 'Emergency',
    description: 'Urgent cases requiring immediate attention',
    icon: AlertCircle,
    color: '#ef4444',
    bgColor: 'bg-red-50',
    hoverColor: 'hover:bg-red-100',
  },
];

export function ServiceSelection({
  services,
  branchId,
  onTicketCreated,
}: ServiceSelectionProps) {
  const [loading, setLoading] = useState(false);
  const [selectedService, setSelectedService] = useState<Service | null>(null);
  const [showPrioritySelection, setShowPrioritySelection] = useState(false);

  function handleSelectService(service: Service) {
    setSelectedService(service);
    setShowPrioritySelection(true);
  }

  function handleBack() {
    setSelectedService(null);
    setShowPrioritySelection(false);
  }

  async function handleSelectPriority(priorityLevel: number) {
    if (!selectedService) return;

    setLoading(true);

    try {
      const ticket = await createTicket({
        service_id: selectedService.id,
        branch_id: branchId,
        priority_level: priorityLevel,
      });

      if (ticket) {
        toast.success('Ticket created successfully!');
        onTicketCreated({ ...ticket, service: selectedService });
      } else {
        toast.error('Failed to create ticket');
      }
    } catch (error) {
      toast.error('An error occurred');
    } finally {
      setLoading(false);
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

  // Show priority selection if service is selected
  if (showPrioritySelection && selectedService) {
    return (
      <div className="mx-auto max-w-6xl">
        {/* Back Button */}
        <Button
          variant="ghost"
          size="lg"
          onClick={handleBack}
          className="mb-8 text-lg"
          disabled={loading}
        >
          <ArrowLeft className="mr-2 h-5 w-5" />
          Back to Services
        </Button>

        {/* Header */}
        <div className="mb-12 text-center">
          <div className="mb-4 flex items-center justify-center gap-3">
            <div
              className="flex h-16 w-16 items-center justify-center rounded-xl text-2xl font-bold text-white shadow-lg"
              style={{ backgroundColor: selectedService.color || '#3b82f6' }}
            >
              {selectedService.prefix}
            </div>
            <h2 className="text-4xl font-bold text-gray-900">{selectedService.name}</h2>
          </div>
          <p className="text-xl text-gray-600">Please select your priority level</p>
        </div>

        {/* Priority Options */}
        <div className="grid gap-6 md:grid-cols-3">
          {priorityOptions.map((option) => {
            const Icon = option.icon;
            return (
              <Card
                key={option.level}
                className={`group relative overflow-hidden border-2 transition-all duration-300 hover:shadow-2xl hover:-translate-y-2 cursor-pointer ${option.hoverColor}`}
                style={{ borderColor: option.color }}
                onClick={() => !loading && handleSelectPriority(option.level)}
              >
                {/* Top Accent Bar */}
                <div
                  className="absolute top-0 left-0 h-2 w-full"
                  style={{ backgroundColor: option.color }}
                />

                <CardContent className="p-8 pt-10">
                  {/* Icon */}
                  <div className="mb-6 flex justify-center">
                    <div
                      className={`flex h-24 w-24 items-center justify-center rounded-full ${option.bgColor} transition-transform duration-300 group-hover:scale-110`}
                    >
                      <Icon className="h-12 w-12" style={{ color: option.color }} />
                    </div>
                  </div>

                  {/* Title */}
                  <h3 className="mb-3 text-center text-2xl font-bold text-gray-900">
                    {option.title}
                  </h3>

                  {/* Description */}
                  <p className="mb-6 text-center text-sm text-gray-600">
                    {option.description}
                  </p>

                  {/* Select Button */}
                  <Button
                    size="lg"
                    className="w-full text-lg font-bold shadow-lg transition-all duration-300 hover:shadow-xl"
                    style={{ backgroundColor: option.color }}
                    disabled={loading}
                  >
                    {loading ? (
                      <>
                        <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                        Creating...
                      </>
                    ) : (
                      'Select'
                    )}
                  </Button>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Info Notice */}
        <div className="mt-12 rounded-xl bg-blue-50 p-6 text-center">
          <p className="text-sm text-gray-700">
            <strong>Note:</strong> Please select the appropriate priority level. Senior citizens and PWDs may be required to present valid identification.
          </p>
        </div>
      </div>
    );
  }

  // Show service selection
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
                disabled={loading}
              >
                Get Your Ticket
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}