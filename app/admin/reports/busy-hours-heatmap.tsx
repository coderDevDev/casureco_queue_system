'use client';

import { Calendar, Clock, TrendingUp } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { HourlyTraffic } from '@/lib/services/reports-service';
import { formatDuration } from '@/lib/utils';

interface BusyHoursHeatmapProps {
  hourlyTraffic: HourlyTraffic[];
  loading: boolean;
}

export function BusyHoursHeatmap({ hourlyTraffic, loading }: BusyHoursHeatmapProps) {
  // Calculate peak hour
  const peakHour = hourlyTraffic.length > 0
    ? hourlyTraffic.reduce((max, t) => (t.ticket_count > max.ticket_count ? t : max)).hour
    : null;

  // Calculate peak day
  const peakDay = hourlyTraffic.length > 0
    ? ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'][
        Object.entries(
          hourlyTraffic.reduce((acc, t) => {
            acc[t.day_of_week] = (acc[t.day_of_week] || 0) + t.ticket_count;
            return acc;
          }, {} as any)
        ).sort(([, a]: any, [, b]: any) => b - a)[0]?.[0] || 0
      ]
    : null;

  // Calculate average peak traffic
  const avgPeakTraffic = hourlyTraffic.length > 0
    ? Math.round(
        hourlyTraffic.reduce((sum, t) => sum + t.ticket_count, 0) / hourlyTraffic.length
      )
    : 0;

  return (
    <div className="space-y-6">
      {/* Heatmap Insights */}
      <div className="grid gap-6 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Peak Hour</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {peakHour !== null ? `${peakHour}:00` : 'N/A'}
            </div>
            <p className="text-xs text-muted-foreground">
              Busiest hour of the day
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Peak Day</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{peakDay || 'N/A'}</div>
            <p className="text-xs text-muted-foreground">
              Busiest day of the week
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg Peak Traffic</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{avgPeakTraffic}</div>
            <p className="text-xs text-muted-foreground">
              Tickets per hour slot
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Heatmap */}
      <Card>
        <CardHeader>
          <CardTitle>Traffic Heatmap (Day × Hour)</CardTitle>
          <p className="text-sm text-gray-500 mt-1">
            Darker colors indicate higher ticket volume
          </p>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="h-[500px] flex items-center justify-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            </div>
          ) : hourlyTraffic.length === 0 ? (
            <div className="h-[300px] flex items-center justify-center text-gray-500">
              No traffic data available for this period
            </div>
          ) : (
            <div className="overflow-x-auto">
              {/* Create heatmap grid */}
              <div className="inline-block min-w-full">
                {/* Header row with hours */}
                <div className="flex">
                  <div className="w-20 flex-shrink-0" /> {/* Empty corner */}
                  {Array.from({ length: 24 }, (_, hour) => (
                    <div
                      key={hour}
                      className="w-12 flex-shrink-0 text-center text-xs font-medium text-gray-600 pb-2"
                    >
                      {hour}
                    </div>
                  ))}
                </div>

                {/* Heatmap rows */}
                {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day, dayIndex) => {
                  // Get max ticket count for color scaling
                  const maxCount = Math.max(
                    ...hourlyTraffic.map((t) => t.ticket_count),
                    1
                  );

                  return (
                    <div key={dayIndex} className="flex items-center">
                      {/* Day label */}
                      <div className="w-20 flex-shrink-0 text-sm font-medium text-gray-700 pr-2">
                        {day}
                      </div>

                      {/* Hour cells */}
                      {Array.from({ length: 24 }, (_, hour) => {
                        const traffic = hourlyTraffic.find(
                          (t) => t.day_of_week === dayIndex && t.hour === hour
                        );
                        const count = traffic?.ticket_count || 0;
                        const intensity = count / maxCount;

                        // Color scale from light blue to dark blue
                        const getColor = (intensity: number) => {
                          if (intensity === 0) return 'bg-gray-100';
                          if (intensity < 0.2) return 'bg-blue-100';
                          if (intensity < 0.4) return 'bg-blue-200';
                          if (intensity < 0.6) return 'bg-blue-400';
                          if (intensity < 0.8) return 'bg-blue-600';
                          return 'bg-blue-800';
                        };

                        return (
                          <div
                            key={hour}
                            className={`w-12 h-12 flex-shrink-0 border border-gray-200 flex items-center justify-center text-xs font-medium transition-all hover:ring-2 hover:ring-blue-500 cursor-pointer ${
                              getColor(intensity)
                            } ${
                              intensity > 0.5 ? 'text-white' : 'text-gray-700'
                            }`}
                            title={`${day} ${hour}:00 - ${count} tickets${traffic ? ` (${formatDuration(Math.round(traffic.avg_wait_time))} wait)` : ''}`}
                          >
                            {count > 0 ? count : ''}
                          </div>
                        );
                      })}
                    </div>
                  );
                })}

                {/* Legend */}
                <div className="mt-6 flex items-center gap-4">
                  <span className="text-sm font-medium text-gray-700">Traffic Level:</span>
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 bg-gray-100 border border-gray-200"></div>
                    <span className="text-xs text-gray-600">None</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 bg-blue-200 border border-gray-200"></div>
                    <span className="text-xs text-gray-600">Low</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 bg-blue-400 border border-gray-200"></div>
                    <span className="text-xs text-gray-600">Medium</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 bg-blue-600 border border-gray-200"></div>
                    <span className="text-xs text-gray-600">High</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 bg-blue-800 border border-gray-200"></div>
                    <span className="text-xs text-gray-600">Very High</span>
                  </div>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Hourly Distribution Chart */}
      <Card>
        <CardHeader>
          <CardTitle>Average Tickets by Hour</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="h-[300px] flex items-center justify-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={300}>
              <BarChart
                data={Array.from({ length: 24 }, (_, hour) => ({
                  hour: `${hour}:00`,
                  tickets: hourlyTraffic
                    .filter((t) => t.hour === hour)
                    .reduce((sum, t) => sum + t.ticket_count, 0) / 7, // Average across 7 days
                }))}
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="hour" />
                <YAxis />
                <Tooltip formatter={(value: number) => [value.toFixed(1), 'Avg Tickets']} />
                <Bar dataKey="tickets" fill="#0033A0" />
              </BarChart>
            </ResponsiveContainer>
          )}
        </CardContent>
      </Card>
    </div>
  );
}