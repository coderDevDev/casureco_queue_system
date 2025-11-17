'use client';

import { Users, Clock, CheckCircle, TrendingUp } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { QueueStats, Counter } from '@/types/queue';
import { formatDuration } from '@/lib/utils';

interface StatsCardsProps {
  stats: QueueStats | null;
  counter: Counter;
}

export function StatsCards({ stats, counter }: StatsCardsProps) {
  // Debug logging
 

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      {/* Waiting Tickets */}
      <Card className="border-0 shadow-lg">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Waiting</CardTitle>
          <div className="rounded-lg bg-blue-100 p-2">
            <Users className="h-4 w-4 text-blue-600" />
          </div>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{stats?.waiting_tickets || 0}</div>
          <p className="text-xs text-muted-foreground">Customers in queue</p>
        </CardContent>
      </Card>

      {/* Avg Wait Time */}
      <Card className="border-0 shadow-lg">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Avg Wait Time</CardTitle>
          <div className="rounded-lg bg-yellow-100 p-2">
            <Clock className="h-4 w-4 text-yellow-600" />
          </div>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">
            {formatDuration(stats?.avg_wait_time || 0)}
          </div>
          <p className="text-xs text-muted-foreground">Average waiting time</p>
        </CardContent>
      </Card>

      {/* Completed Today */}
      <Card className="border-0 shadow-lg">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Completed Today</CardTitle>
          <div className="rounded-lg bg-green-100 p-2">
            <CheckCircle className="h-4 w-4 text-green-600" />
          </div>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{stats?.completed_tickets || 0}</div>
          <p className="text-xs text-muted-foreground">Tickets served</p>
        </CardContent>
      </Card>

      {/* Avg Service Time */}
      <Card className="border-0 shadow-lg">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Avg Service Time</CardTitle>
          <div className="rounded-lg bg-purple-100 p-2">
            <TrendingUp className="h-4 w-4 text-purple-600" />
          </div>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">
            {formatDuration(stats?.avg_service_time || 0)}
          </div>
          <p className="text-xs text-muted-foreground">Per ticket</p>
        </CardContent>
      </Card>
    </div>
  );
}