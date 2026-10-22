import { z } from 'zod';

const money = z.number().nonnegative('must be 0 or more').max(9_999_999_999.99, 'is too large')
  .refine((n) => /^\d+(\.\d{1,2})?$/.test(String(n)), 'can have at most 2 decimal places');
export const creditorIdSchema = z.object({ id: z.coerce.number().int().positive() });
export const createCreditorSchema = z.object({
  name: z.string().trim().min(1, 'is required').max(120, 'must be 120 characters or fewer'),
  category: z.string().trim().max(80, 'must be 80 characters or fewer').nullish(),
});
export const createPayableTransactionSchema = z.object({
  txn_date: z.iso.date('must be a date in YYYY-MM-DD format'),
  description: z.string().trim().max(255, 'must be 255 characters or fewer').nullish(),
  amount_owed: money,
  amount_paid: money.default(0),
});
export type CreateCreditorInput = z.infer<typeof createCreditorSchema>;
export type CreatePayableTransactionInput = z.infer<typeof createPayableTransactionSchema>;
