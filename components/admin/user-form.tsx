'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { 
  createUserSchema, 
  updateUserSchema, 
  type CreateUserFormData, 
  type UpdateUserFormData 
} from '@/lib/validations/user';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { User, Mail, Lock, Shield, Building2, AlertCircle, Loader2, Save, X, Eye, EyeOff } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useState } from 'react';

interface Branch {
  id: string;
  name: string;
}

interface UserFormProps {
  defaultValues?: Partial<CreateUserFormData | UpdateUserFormData>;
  branches: Branch[];
  onSubmit: (data: CreateUserFormData | UpdateUserFormData) => Promise<void>;
  onCancel: () => void;
  isSubmitting?: boolean;
  isEditing?: boolean;
  existingUsers?: Array<{ email: string; id?: string }>;
  editingUserId?: string;
}

export function UserForm({ 
  defaultValues, 
  branches,
  onSubmit, 
  onCancel,
  isSubmitting = false,
  isEditing = false,
  existingUsers = [],
  editingUserId 
}: UserFormProps) {
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    setError,
    formState: { errors },
  } = useForm<CreateUserFormData | UpdateUserFormData>({
    resolver: zodResolver(isEditing ? updateUserSchema : createUserSchema),
    defaultValues: {
      name: '',
      email: '',
      ...(!isEditing && { password: '', confirmPassword: '' }),
      role: 'staff',
      branch_id: '',
      is_active: true,
      ...defaultValues,
    },
  });

  const isActive = watch('is_active');
  const role = watch('role');
  const branchId = watch('branch_id');

  const handleFormSubmit = async (data: CreateUserFormData | UpdateUserFormData) => {
    // Check for duplicate email (only for new users)
    if (!isEditing) {
      const duplicateEmail = existingUsers.find(
        (user) => 
          user.email.toLowerCase() === data.email.toLowerCase() && 
          user.id !== editingUserId
      );
      if (duplicateEmail) {
        setError('email', { 
          type: 'manual', 
          message: 'A user with this email already exists' 
        });
        return;
      }
    }

    await onSubmit(data);
  };

  return (
    <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-6">
      {/* Basic Information Section */}
      <div className="space-y-4">
        <div className="flex items-center gap-3 pb-3 border-b border-gray-200">
          <div className="p-2 rounded-xl bg-blue-600 shadow-md">
            <User className="h-5 w-5 text-white" />
          </div>
          <div>
            <h3 className="font-semibold text-gray-900">User Information</h3>
            <p className="text-sm text-gray-600">Basic user details and contact</p>
          </div>
        </div>

        {/* Full Name */}
        <div className="space-y-2">
          <Label htmlFor="name" className="flex items-center gap-2">
            <User className="h-4 w-4 text-gray-600" />
            Full Name
            <span className="text-red-500">*</span>
          </Label>
          <Input
            id="name"
            {...register('name')}
            placeholder="e.g., Juan Dela Cruz"
            className={cn(
              'transition-all duration-200',
              errors.name && 'border-red-500 focus:ring-red-500'
            )}
          />
          {errors.name && (
            <p className="text-sm text-red-600 flex items-center gap-1">
              <AlertCircle className="h-3 w-3" />
              {errors.name.message}
            </p>
          )}
        </div>

        {/* Email Address */}
        <div className="space-y-2">
          <Label htmlFor="email" className="flex items-center gap-2">
            <Mail className="h-4 w-4 text-gray-600" />
            Email Address
            <span className="text-red-500">*</span>
          </Label>
          <Input
            id="email"
            type="email"
            {...register('email')}
            placeholder="user@example.com"
            disabled={isEditing}
            className={cn(
              'transition-all duration-200',
              errors.email && 'border-red-500 focus:ring-red-500',
              isEditing && 'bg-gray-50 cursor-not-allowed'
            )}
          />
          {isEditing && (
            <p className="text-xs text-gray-500">
              Email cannot be changed for existing users
            </p>
          )}
          {errors.email && (
            <p className="text-sm text-red-600 flex items-center gap-1">
              <AlertCircle className="h-3 w-3" />
              {errors.email.message}
            </p>
          )}
        </div>

        {/* Password Fields (Only for new users) */}
        {!isEditing && (
          <>
            <div className="space-y-2">
              <Label htmlFor="password" className="flex items-center gap-2">
                <Lock className="h-4 w-4 text-gray-600" />
                Password
                <span className="text-red-500">*</span>
              </Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  {...register('password' as keyof CreateUserFormData)}
                  placeholder="Enter secure password"
                  className={cn(
                    'pr-10 transition-all duration-200',
                    'password' in errors && errors.password && 'border-red-500 focus:ring-red-500'
                  )}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
              <p className="text-xs text-gray-500">
                Must contain uppercase, lowercase, and number (min 8 characters)
              </p>
              {'password' in errors && errors.password && (
                <p className="text-sm text-red-600 flex items-center gap-1">
                  <AlertCircle className="h-3 w-3" />
                  {errors.password.message}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="confirmPassword" className="flex items-center gap-2">
                <Lock className="h-4 w-4 text-gray-600" />
                Confirm Password
                <span className="text-red-500">*</span>
              </Label>
              <div className="relative">
                <Input
                  id="confirmPassword"
                  type={showConfirmPassword ? 'text' : 'password'}
                  {...register('confirmPassword' as keyof CreateUserFormData)}
                  placeholder="Re-enter password"
                  className={cn(
                    'pr-10 transition-all duration-200',
                    'confirmPassword' in errors && errors.confirmPassword && 'border-red-500 focus:ring-red-500'
                  )}
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
              {'confirmPassword' in errors && errors.confirmPassword && (
                <p className="text-sm text-red-600 flex items-center gap-1">
                  <AlertCircle className="h-3 w-3" />
                  {errors.confirmPassword.message}
                </p>
              )}
            </div>
          </>
        )}
      </div>

      {/* Role & Assignment Section */}
      <div className="space-y-4">
        <div className="flex items-center gap-3 pb-3 border-b border-gray-200">
          <div className="p-2 rounded-xl bg-purple-600 shadow-md">
            <Shield className="h-5 w-5 text-white" />
          </div>
          <div>
            <h3 className="font-semibold text-gray-900">Role & Assignment</h3>
            <p className="text-sm text-gray-600">User permissions and location</p>
          </div>
        </div>

        {/* Role Selection */}
        <div className="space-y-2">
          <Label htmlFor="role" className="flex items-center gap-2">
            <Shield className="h-4 w-4 text-gray-600" />
            User Role
            <span className="text-red-500">*</span>
          </Label>
          <Select 
            value={role} 
            onValueChange={(value: 'admin' | 'staff' | 'supervisor') => setValue('role', value)}
          >
            <SelectTrigger className={cn(
              'transition-all duration-200',
              errors.role && 'border-red-500 focus:ring-red-500'
            )}>
              <SelectValue placeholder="Select user role" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="staff">
                <div className="flex items-center gap-2">
                  <User className="h-4 w-4 text-blue-600" />
                  <span>Staff</span>
                </div>
              </SelectItem>
              <SelectItem value="supervisor">
                <div className="flex items-center gap-2">
                  <Shield className="h-4 w-4 text-purple-600" />
                  <span>Supervisor</span>
                </div>
              </SelectItem>
              <SelectItem value="admin">
                <div className="flex items-center gap-2">
                  <Shield className="h-4 w-4 text-red-600" />
                  <span>Administrator</span>
                </div>
              </SelectItem>
            </SelectContent>
          </Select>
          <p className="text-xs text-gray-500">
            {role === 'admin' && 'Full system access and user management'}
            {role === 'supervisor' && 'Can manage staff and monitor operations'}
            {role === 'staff' && 'Can serve customers at assigned counter'}
          </p>
          {errors.role && (
            <p className="text-sm text-red-600 flex items-center gap-1">
              <AlertCircle className="h-3 w-3" />
              {errors.role.message}
            </p>
          )}
        </div>

        {/* Branch Selection */}
        <div className="space-y-2">
          <Label htmlFor="branch_id" className="flex items-center gap-2">
            <Building2 className="h-4 w-4 text-gray-600" />
            Branch Assignment
          </Label>
          <Select 
            value={branchId || 'no-branch'} 
            onValueChange={(value) => setValue('branch_id', value === 'no-branch' ? '' : value)}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select a branch (optional)" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="no-branch">No Branch Assigned</SelectItem>
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
            Optional: Assign user to a specific branch location
          </p>
        </div>

        {/* Active Status */}
        <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg border border-gray-200">
          <div className="space-y-0.5">
            <Label htmlFor="is_active" className="text-base font-medium cursor-pointer">
              User Active
            </Label>
            <p className="text-sm text-gray-600">
              {isActive ? 'User can log in and access the system' : 'User account is disabled'}
            </p>
          </div>
          <Switch
            id="is_active"
            checked={isActive}
            onCheckedChange={(checked) => setValue('is_active', checked)}
          />
        </div>
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
              {isEditing ? 'Update User' : 'Create User'}
            </>
          )}
        </Button>
      </div>
    </form>
  );
}
