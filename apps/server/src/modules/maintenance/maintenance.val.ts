import { z } from 'zod';

export const createMaintenanceSchema = z.object({
  maint_date: z.iso.date('must be a date in YYYY-MM-DD format'),
  equipment: z.string().trim().min(1, 'is required').max(120, 'must be 120 characters or fewer'),
  description: z.string().trim().max(255, 'must be 255 characters or fewer').nullish(),
  cost: z.number().nonnegative('must be 0 or more').max(9_999_999_999.99, 'is too large')
    .refine((n) => /^\d+(\.\d{1,2})?$/.test(String(n)), 'can have at most 2 decimal places'),
  vendor: z.string().trim().max(120, 'must be 120 characters or fewer').nullish(),
});
export type CreateMaintenanceInput = z.infer<typeof createMaintenanceSchema>;
