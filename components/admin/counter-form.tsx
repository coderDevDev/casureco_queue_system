'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { counterSchema, type CounterFormData } from '@/lib/validations/counter';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Monitor, Building2, AlertCircle, Loader2, Save, X, Activity } from 'lucide-react';
import { cn } from '@/lib/utils';

interface Branch {
  id: string;
  name: string;
}

interface CounterFormProps {
  defaultValues?: Partial<CounterFormData>;
  branches: Branch[];
  onSubmit: (data: CounterFormData) => Promise<void>;
  onCancel: () => void;
  isSubmitting?: boolean;
  existingCounters?: Array<{ name: string; id?: string }>;
  editingCounterId?: string;
}

export function CounterForm({ 
  defaultValues, 
  branches,
  onSubmit, 
  onCancel,
  isSubmitting = false,
  existingCounters = [],
  editingCounterId 
}: CounterFormProps) {
  const {
    register,
    handleSubmit,
    watch,
    setValue,
    setError,
    formState: { errors },
  } = useForm<CounterFormData>({
    resolver: zodResolver(counterSchema),
    defaultValues: {
      name: '',
      branch_id: '',
      is_active: true,
      is_paused: false,
      ...defaultValues,
    },
  });

  const isActive = watch('is_active');
  const isPaused = watch('is_paused');
  const branchId = watch('branch_id');

  const handleFormSubmit = async (data: CounterFormData) => {
    // Check for duplicate name
    const duplicateName = existingCounters.find(
      (counter) => 
        counter.name.toLowerCase() === data.name.toLowerCase() && 
        counter.id !== editingCounterId
    );
    if (duplicateName) {
      setError('name', { 
        type: 'manual', 
        message: 'A counter with this name already exists' 
      });
      return;
    }

    await onSubmit(data);
  };

  return (
    <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-6">
      {/* Basic Information Section */}
      <div className="space-y-4">
        <div className="flex items-center gap-3 pb-3 border-b border-gray-200">
          <div className="p-2 rounded-xl bg-blue-600 shadow-md">
            <Monitor className="h-5 w-5 text-white" />
          </div>
          <div>
            <h3 className="font-semibold text-gray-900">Counter Information</h3>
            <p className="text-sm text-gray-600">Basic counter details and location</p>
          </div>
        </div>

        {/* Counter Name */}
        <div className="space-y-2">
          <Label htmlFor="name" className="flex items-center gap-2">
            <Monitor className="h-4 w-4 text-gray-600" />
            Counter Name
            <span className="text-red-500">*</span>
          </Label>
          <Input
            id="name"
            {...register('name')}
            placeholder="e.g., Counter 1, Service Desk A"
            className={cn(
              'transition-all duration-200',
              errors.name && 'border-red-500 focus:ring-red-500'
            )}
          />
          <p className="text-xs text-gray-500">
            Use a unique, descriptive name for easy identification
          </p>
          {errors.name && (
            <p className="text-sm text-red-600 flex items-center gap-1">
              <AlertCircle className="h-3 w-3" />
              {errors.name.message}
            </p>
          )}
        </div>

        {/* Branch Selection */}
        <div className="space-y-2">
          <Label htmlFor="branch_id" className="flex items-center gap-2">
            <Building2 className="h-4 w-4 text-gray-600" />
            Branch Location
            <span className="text-red-500">*</span>
          </Label>
          <Select 
            value={branchId} 
            onValueChange={(value) => setValue('branch_id', value)}
          >
            <SelectTrigger className={cn(
              'transition-all duration-200',
              errors.branch_id && 'border-red-500 focus:ring-red-500'
            )}>
              <SelectValue placeholder="Select a branch" />
            </SelectTrigger>
            <SelectContent>
              {branches.length === 0 ? (
                <div className="p-2 text-sm text-gray-500 text-center">
                  No branches available
                </div>
              ) : (
                branches.map((branch) => (
                  <SelectItem key={branch.id} value={branch.id}>
                    {branch.name}
                  </SelectItem>
                ))
              )}
            </SelectContent>
          </Select>
          <p className="text-xs text-gray-500">
            Assign this counter to a specific branch
          </p>
          {errors.branch_id && (
            <p className="text-sm text-red-600 flex items-center gap-1">
              <AlertCircle className="h-3 w-3" />
              {errors.branch_id.message}
            </p>
          )}
        </div>
      </div>

      {/* Status Configuration Section */}
      <div className="space-y-4">
        <div className="flex items-center gap-3 pb-3 border-b border-gray-200">
          <div className="p-2 rounded-xl bg-green-600 shadow-md">
            <Activity className="h-5 w-5 text-white" />
          </div>
          <div>
            <h3 className="font-semibold text-gray-900">Status Settings</h3>
            <p className="text-sm text-gray-600">Control counter availability</p>
          </div>
        </div>

        {/* Active Status */}
        <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg border border-gray-200">
          <div className="space-y-0.5">
            <Label htmlFor="is_active" className="text-base font-medium cursor-pointer">
              Counter Active
            </Label>
            <p className="text-sm text-gray-600">
              {isActive ? 'Counter is active and can serve customers' : 'Counter is inactive and unavailable'}
            </p>
          </div>
          <Switch
            id="is_active"
            checked={isActive}
            onCheckedChange={(checked) => setValue('is_active', checked)}
          />
        </div>

        {/* Paused Status */}
        <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg border border-gray-200">
          <div className="space-y-0.5">
            <Label htmlFor="is_paused" className="text-base font-medium cursor-pointer">
              Counter Paused
            </Label>
            <p className="text-sm text-gray-600">
              {isPaused ? 'Counter is temporarily paused' : 'Counter is operating normally'}
            </p>
          </div>
          <Switch
            id="is_paused"
            checked={isPaused}
            onCheckedChange={(checked) => setValue('is_paused', checked)}
            disabled={!isActive}
          />
        </div>

        {!isActive && (
          <div className="flex items-start gap-2 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
            <AlertCircle className="h-4 w-4 text-yellow-600 mt-0.5" />
            <p className="text-sm text-yellow-800">
              Inactive counters cannot be paused. Activate the counter first to enable pause functionality.
            </p>
          </div>
        )}
      </div>

      {/* Form Actions */}
      <div className="flex justify-end gap-3 pt-4 border-t border-gray-200">
        <Button
          type="button"
          variant="outline"
          onClick={onCancel}
          disabled={isSubmitting}
          className="min-w-[100px]"
        >
          <X className="h-4 w-4 mr-2" />
          Cancel
        </Button>
        <Button
          type="submit"
          disabled={isSubmitting}
          className="min-w-[100px] bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800"
        >
          {isSubmitting ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Saving...
            </>
          ) : (
            <>
              <Save className="h-4 w-4 mr-2" />
              Save Counter
            </>
          )}
        </Button>
      </div>
    </form>
  );
}
