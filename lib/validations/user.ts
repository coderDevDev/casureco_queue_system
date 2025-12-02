import { z } from 'zod';

// Base schema for user fields
const baseUserSchema = z.object({
  name: z.string()
    .min(2, 'Name must be at least 2 characters')
    .max(100, 'Name must be 100 characters or less')
    .regex(/^[a-zA-Z\s\-'.]+$/, 'Name can only contain letters, spaces, hyphens, apostrophes, and periods'),
  email: z.string()
    .email('Invalid email address')
    .toLowerCase(),
  role: z.enum(['admin', 'staff', 'supervisor'], {
    errorMap: () => ({ message: 'Please select a valid role' })
  }),
  branch_id: z.string().optional(),
  is_active: z.boolean(),
});

// Schema for creating new users (requires password)
export const createUserSchema = baseUserSchema.extend({
  password: z.string()
    .min(8, 'Password must be at least 8 characters')
    .max(100, 'Password is too long')
    .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
    .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
    .regex(/[0-9]/, 'Password must contain at least one number'),
  confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

// Schema for updating existing users (no password required)
export const updateUserSchema = baseUserSchema;

export type CreateUserFormData = z.infer<typeof createUserSchema>;
export type UpdateUserFormData = z.infer<typeof updateUserSchema>;
export type UserFormData = CreateUserFormData | UpdateUserFormData;
