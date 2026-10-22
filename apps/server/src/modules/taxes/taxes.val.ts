import { z } from 'zod';
const money = z.preprocess((value) => {
  if (typeof value === 'object' && value !== null && 'value' in value) return (value as { value: unknown }).value;
  return value;
}, z.coerce.number().nonnegative('must be 0 or more').max(9_999_999_999.99, 'is too large').refine((n) => /^\d+(\.\d{1,2})?$/.test(String(n)), 'can have at most 2 decimal places'));
export const taxIdSchema = z.object({ id: z.coerce.number().int().positive() });
export const taxRecordSchema = z.object({
  tax_name: z.string().trim().min(1).max(120),
  description: z.string().trim().min(1).max(255),
  frequency: z.enum(['monthly', 'yearly']),
  period_label: z.string().trim().min(4).max(20),
  due_date: z.iso.date(),
  amount_due: money.default(0),
  amount_paid: money.default(0),
  payment_date: z.iso.date().nullable().optional(),
}).superRefine((row, ctx) => {
  const valid = row.frequency === 'monthly' ? /^\d{4}-(0[1-9]|1[0-2])$/.test(row.period_label) : /^\d{4}$/.test(row.period_label);
  if (!valid) ctx.addIssue({ code: 'custom', path: ['period_label'], message: row.frequency === 'monthly' ? 'must use YYYY-MM for monthly tax' : 'must use YYYY for yearly tax' });
});
export type TaxRecordInput = z.infer<typeof taxRecordSchema>;
