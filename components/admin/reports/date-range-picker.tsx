'use client';

import { useState } from 'react';
import { Calendar } from 'lucide-react';
import { DateRange, Range, RangeKeyDict } from 'react-date-range';
import { format } from 'date-fns';
import { Button } from '@/components/ui/button';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import 'react-date-range/dist/styles.css';
import 'react-date-range/dist/theme/default.css';

interface DateRangePickerProps {
  dateRange: { start: Date; end: Date };
  onDateRangeChange: (range: { start: Date; end: Date }) => void;
}

export function DateRangePicker({ dateRange, onDateRangeChange }: DateRangePickerProps) {
  const [open, setOpen] = useState(false);
  const [selection, setSelection] = useState<Range>({
    startDate: dateRange.start,
    endDate: dateRange.end,
    key: 'selection',
  });

  const handleSelect = (ranges: RangeKeyDict) => {
    const { selection } = ranges;
    if (selection.startDate && selection.endDate) {
      setSelection(selection);
      onDateRangeChange({
        start: selection.startDate,
        end: selection.endDate,
      });
    }
  };

  const presets = [
    {
      label: 'Today',
      getValue: () => ({
        start: new Date(),
        end: new Date(),
      }),
    },
    {
      label: 'Last 7 Days',
      getValue: () => ({
        start: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
        end: new Date(),
      }),
    },
    {
      label: 'Last 30 Days',
      getValue: () => ({
        start: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
        end: new Date(),
      }),
    },
    {
      label: 'This Month',
      getValue: () => {
        const now = new Date();
        return {
          start: new Date(now.getFullYear(), now.getMonth(), 1),
          end: new Date(now.getFullYear(), now.getMonth() + 1, 0),
        };
      },
    },
    {
      label: 'Last Month',
      getValue: () => {
        const now = new Date();
        return {
          start: new Date(now.getFullYear(), now.getMonth() - 1, 1),
          end: new Date(now.getFullYear(), now.getMonth(), 0),
        };
      },
    },
  ];

  const handlePresetClick = (preset: typeof presets[0]) => {
    const range = preset.getValue();
    setSelection({
      startDate: range.start,
      endDate: range.end,
      key: 'selection',
    });
    onDateRangeChange(range);
    setOpen(false);
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          className="gap-2 border-gray-300 hover:border-[#0033A0] hover:text-[#0033A0]"
        >
          <Calendar className="h-4 w-4" />
          {format(dateRange.start, 'MMM dd, yyyy')} - {format(dateRange.end, 'MMM dd, yyyy')}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0" align="end">
        <div className="flex">
          {/* Presets */}
          <div className="border-r border-gray-200 p-3 space-y-1">
            <div className="text-sm font-semibold text-gray-700 mb-2">Quick Select</div>
            {presets.map((preset) => (
              <Button
                key={preset.label}
                variant="ghost"
                size="sm"
                className="w-full justify-start text-sm"
                onClick={() => handlePresetClick(preset)}
              >
                {preset.label}
              </Button>
            ))}
          </div>

          {/* Calendar */}
          <div>
            <DateRange
              ranges={[selection]}
              onChange={handleSelect}
              moveRangeOnFirstSelection={false}
              months={2}
              direction="horizontal"
              rangeColors={['#0033A0']}
              maxDate={new Date()}
            />
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}
