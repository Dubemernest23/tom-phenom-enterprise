import { z } from 'zod';

const MAX_MONEY_10 = 99_999_999.99;
const MAX_MONEY_12 = 9_999_999_999.99;
const money = (max: number) => z.number().nonnegative('must be 0 or more').max(max, 'is too large')
  .refine((n) => /^\d+(\.\d{1,2})?$/.test(String(n)), 'can have at most 2 decimal places');

export const customerIdSchema = z.object({ id: z.coerce.number().int().positive() });
export const createCustomerSchema = z.object({
  name: z.string().trim().min(1, 'is required').max(120, 'must be 120 characters or fewer'),
  phone: z.string().trim().max(30, 'must be 30 characters or fewer').nullable().optional(),
});
export const createCustomerTransactionSchema = z.object({
  txn_date: z.iso.date('must be a date in YYYY-MM-DD format'),
  quantity: z.number().int().nonnegative().max(2_147_483_647),
  price_given: money(MAX_MONEY_10),
  amount_expected: money(MAX_MONEY_12).optional(),
  amount_paid: money(MAX_MONEY_12).default(0),
  payment_method: z.enum(['cash', 'transfer']).nullable().default(null),
  payment_status: z.enum(['paid', 'pay_later']).default('pay_later'),
  payment_date: z.iso.date('must be a date in YYYY-MM-DD format').nullable().optional(),
});
export const customerTransactionIdSchema = z.object({ transactionId: z.coerce.number().int().positive() });
export type CreateCustomerInput = z.infer<typeof createCustomerSchema>;
export type CreateCustomerTransactionInput = z.infer<typeof createCustomerTransactionSchema>;
