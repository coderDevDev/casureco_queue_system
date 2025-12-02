import { z } from 'zod';

export const counterSchema = z.object({
  name: z.string()
    .min(1, 'Counter name is required')
    .max(50, 'Counter name must be 50 characters or less')
    .regex(/^[a-zA-Z0-9\s\-]+$/, 'Counter name can only contain letters, numbers, spaces, and hyphens'),
  branch_id: z.string().uuid('Please select a valid branch'),
  is_active: z.boolean(),
  is_paused: z.boolean(),
});

export type CounterFormData = z.infer<typeof counterSchema>;
