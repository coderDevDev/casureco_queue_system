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
      <Card className="w-full max-w-3xl border-0 shadow-2xl">
        <CardHeader className="bg-gradient-to-r from-[#0033A0] to-[#1A237E] text-white">
          <CardTitle className="text-2xl">Select Your Counter</CardTitle>
          <CardDescription className="text-white/80">
            Choose an available counter to start serving customers
          </CardDescription>
        </CardHeader>
        <CardContent className="p-8">
          {counters.length === 0 ? (
            <div className="py-16 text-center">
              <div className="mx-auto mb-4 flex h-20 w-20 items-center justify-center rounded-full bg-gray-100">
                <Monitor className="h-10 w-10 text-gray-400" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900">
                No counters available
              </h3>
              <p className="mt-2 text-gray-500">
                All counters are currently in use. Please wait for one to become available.
              </p>
            </div>
          ) : (
            <div className="grid gap-6 sm:grid-cols-2">
              {counters.map((counter) => (
                <Card
                  key={counter.id}
                  className="group relative overflow-hidden border-2 border-gray-200 transition-all duration-300 hover:border-[#0033A0] hover:shadow-xl hover:-translate-y-1"
                >
                  <div className="absolute right-0 top-0 h-24 w-24 rounded-full bg-[#0033A0] opacity-5 blur-2xl" />
                  <CardContent className="relative p-6">
                    <div className="mb-4 flex items-start justify-between">
                      <div className="flex items-center gap-3">
                        <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-[#0033A0] to-[#1A237E] text-white">
                          <Monitor className="h-6 w-6" />
                        </div>
                        <div>
                          <h3 className="text-xl font-bold text-gray-900">{counter.name}</h3>
                          <Badge className="mt-1 bg-green-100 text-green-700 hover:bg-green-100">
                            Available
                          </Badge>
                        </div>
                      </div>
                    </div>
                    {counter.services && counter.services.length > 0 && (
                      <div className="mb-4 rounded-lg bg-blue-50 p-3">
                        <p className="text-xs font-semibold text-blue-900 mb-1">Services:</p>
                        <p className="text-sm text-blue-700">
                          {counter.services.join(', ')}
                        </p>
                      </div>
                    )}
                    <Button
                      size="lg"
                      className="w-full bg-gradient-to-r from-[#0033A0] to-[#1A237E] hover:from-[#002080] hover:to-[#0d1554]"
                      onClick={() => handleAssign(counter.id)}
                      disabled={assigning === counter.id}
                    >
                      {assigning === counter.id ? (
                        <>
                          <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                          Assigning...
                        </>
                      ) : (
                        'Select This Counter'
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