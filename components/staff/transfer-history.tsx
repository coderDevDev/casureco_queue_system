'use client';

import { useState, useEffect } from 'react';
import { History, ArrowRightLeft, User, Clock } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { createClient } from '@/lib/supabase/client';
import { formatDistanceToNow } from 'date-fns';

interface TransferRecord {
  id: string;
  ticket_number: string;
  service_name: string;
  transferred_from_counter: string;
  transferred_to_counter: string;
  transferred_by_name: string;
  transfer_reason: string;
  transferred_at: string;
  priority_level: number;
}

interface TransferHistoryProps {
  branchId: string;
  limit?: number;
}

export function TransferHistory({ branchId, limit = 10 }: TransferHistoryProps) {
  const [transfers, setTransfers] = useState<TransferRecord[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchTransferHistory();
  }, [branchId]);

  async function fetchTransferHistory() {
    const supabase = createClient();

    const { data, error } = await supabase
      .from('tickets')
      .select(`
        id,
        ticket_number,
        priority_level,
        transfer_reason,
        transferred_at,
        service:services(name),
        from_counter:counters!tickets_transferred_from_counter_id_fkey(name),
        to_counter:counters!tickets_preferred_counter_id_fkey(name),
        transferred_by_user:users!tickets_transferred_by_fkey(name)
      `)
      .eq('branch_id', branchId)
      .not('preferred_counter_id', 'is', null)
      .not('transferred_at', 'is', null)
      .order('transferred_at', { ascending: false })
      .limit(limit);

    if (error) {
      console.error('Error fetching transfer history:', error);
      setLoading(false);
      return;
    }

    const records: TransferRecord[] = (data || []).map((item: any) => ({
      id: item.id,
      ticket_number: item.ticket_number,
      service_name: item.service?.name || 'Unknown',
      transferred_from_counter: item.from_counter?.name || 'Unknown',
      transferred_to_counter: item.to_counter?.name || 'Unknown',
      transferred_by_name: item.transferred_by_user?.name || 'Unknown',
      transfer_reason: item.transfer_reason || 'No reason provided',
      transferred_at: item.transferred_at,
      priority_level: item.priority_level,
    }));

    setTransfers(records);
    setLoading(false);
  }

  if (loading) {
    return (
      <Card className="border-0 shadow-xl">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <History className="h-5 w-5 text-gray-600" />
            Transfer History
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-0 shadow-xl">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <History className="h-5 w-5 text-gray-600" />
          Transfer History
          <Badge variant="secondary" className="ml-auto">
            {transfers.length}
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent>
        {transfers.length === 0 ? (
          <div className="py-8 text-center">
            <History className="mx-auto h-12 w-12 text-gray-400 mb-3" />
            <p className="text-sm text-gray-500">No transfer history yet</p>
          </div>
        ) : (
          <div className="space-y-3">
            {transfers.map((transfer) => (
              <div
                key={transfer.id}
                className="rounded-lg border border-gray-200 bg-white p-4 hover:border-blue-300 transition-colors"
              >
                <div className="flex items-start justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-gray-900">
                      {transfer.ticket_number}
                    </span>
                    {transfer.priority_level === 1 && (
                      <Badge className="bg-amber-500 text-white text-xs">
                        Senior/PWD
                      </Badge>
                    )}
                    {transfer.priority_level === 2 && (
                      <Badge variant="destructive" className="text-xs">
                        Emergency
                      </Badge>
                    )}
                  </div>
                  <span className="text-xs text-gray-500">
                    {formatDistanceToNow(new Date(transfer.transferred_at), {
                      addSuffix: true,
                    })}
                  </span>
                </div>

                <div className="flex items-center gap-2 text-sm text-gray-600 mb-2">
                  <span className="font-medium">{transfer.transferred_from_counter}</span>
                  <ArrowRightLeft className="h-4 w-4 text-blue-500" />
                  <span className="font-medium">{transfer.transferred_to_counter}</span>
                </div>

                <div className="flex items-center gap-4 text-xs text-gray-500">
                  <div className="flex items-center gap-1">
                    <User className="h-3 w-3" />
                    <span>{transfer.transferred_by_name}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    <span>{transfer.service_name}</span>
                  </div>
                </div>

                {transfer.transfer_reason && (
                  <div className="mt-2 text-xs text-gray-600 italic">
                    "{transfer.transfer_reason}"
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}