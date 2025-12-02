import { z } from 'zod';

export const serviceSchema = z.object({
  name: z.string().min(1, 'Service name is required').max(100, 'Service name is too long'),
  prefix: z.string()
    .min(1, 'Service prefix is required')
    .max(10, 'Prefix must be 10 characters or less')
    .regex(/^[A-Z0-9]+$/, 'Prefix must contain only uppercase letters and numbers'),
  description: z.string().max(500, 'Description is too long').optional(),
  avg_service_time: z.number()
    .min(60, 'Service time must be at least 1 minute')
    .max(7200, 'Service time cannot exceed 2 hours'),
  color: z.string().regex(/^#[0-9A-Fa-f]{6}$/, 'Invalid color format'),
  icon: z.string().max(50, 'Icon name is too long').optional(),
  is_active: z.boolean(),
  branch_id: z.string().uuid('Invalid branch ID'),
});

export type ServiceFormData = z.infer<typeof serviceSchema>;

// Helper function to create schema with async validation
export const createServiceSchemaWithValidation = (
  checkNameExists: (name: string) => Promise<boolean>,
  checkPrefixExists: (prefix: string) => Promise<boolean>
) => {
  return serviceSchema
    .refine(
      async (data) => !(await checkNameExists(data.name)),
      { message: 'A service with this name already exists', path: ['name'] }
    )
    .refine(
      async (data) => !(await checkPrefixExists(data.prefix)),
      { message: 'A service with this prefix already exists', path: ['prefix'] }
    );
};
