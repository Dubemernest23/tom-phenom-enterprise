import { z } from 'zod';
const money = z.number().nonnegative('must be 0 or more').max(9_999_999_999.99, 'is too large').refine((n) => /^\d+(\.\d{1,2})?$/.test(String(n)), 'can have at most 2 decimal places');
export const inspectionIdSchema = z.object({ id: z.coerce.number().int().positive() });
export const inspectionSchema = z.object({
  agency_name: z.string().trim().min(1).max(120),
  checked_items: z.string().trim().min(1).max(5000),
  inspection_date: z.iso.date(),
  recommendations: z.string().trim().max(5000).nullish(),
  fee_paid: money.default(0),
  tips_paid: money.default(0),
});
export type InspectionInput = z.infer<typeof inspectionSchema>;
