'use client';

import { useState, useEffect } from 'react';
import { Monitor, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { getAvailableCounters, assignCounter } from '@/lib/services/counter-service';
import { Counter } from '@/types/queue';
import { useAuth } from '@/lib/hooks/use-auth';

interface CounterSelectionProps {
  onCounterAssigned: (counter: Counter) => void;
}

export function CounterSelection({ onCounterAssigned }: CounterSelectionProps) {
  const { profile } = useAuth();
  const [counters, setCounters] = useState<Counter[]>([]);
  const [loading, setLoading] = useState(true);
  const [assigning, setAssigning] = useState<string | null>(null);

  useEffect(() => {
    async function loadCounters() {
      if (!profile?.branch_id) return;
      
      const data = await getAvailableCounters(profile.branch_id);
      setCounters(data);
      setLoading(false);
    }

    loadCounters();
  }, [profile?.branch_id]);

  async function handleAssign(counterId: string) {
    if (!profile?.id) return;

    setAssigning(counterId);
    const counter = await assignCounter(counterId, profile.id);
    
    if (counter) {
      onCounterAssigned(counter);
    }
    
    setAssigning(null);
  }

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center p-4">
      <Card className="w-full max-w-2xl">
        <CardHeader>
          <CardTitle>Select Your Counter</CardTitle>
          <CardDescription>
            Choose an available counter to start serving customers
          </CardDescription>
        </CardHeader>
        <CardContent>
          {counters.length === 0 ? (
            <div className="py-12 text-center">
              <Monitor className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-4 text-lg font-medium text-gray-900">
                No counters available
              </h3>
              <p className="mt-2 text-sm text-gray-500">
                All counters are currently in use. Please wait for one to become available.
              </p>
            </div>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2">
              {counters.map((counter) => (
                <Card
                  key={counter.id}
                  className="cursor-pointer transition-all hover:shadow-md"
                >
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="text-lg font-semibold">{counter.name}</h3>
                        {counter.services && (
                          <p className="mt-1 text-sm text-gray-500">
                            Services: {counter.services.join(', ')}
                          </p>
                        )}
                      </div>
                      <Badge variant="outline" className="ml-2">
                        Available
                      </Badge>
                    </div>
                    <Button
                      className="mt-4 w-full"
                      onClick={() => handleAssign(counter.id)}
                      disabled={assigning === counter.id}
                    >
                      {assigning === counter.id ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Assigning...
                        </>
                      ) : (
                        'Select Counter'
                      )}
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}