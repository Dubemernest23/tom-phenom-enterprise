import { z } from 'zod';

const MAX_MONEY_10 = 99_999_999.99;
const MAX_MONEY_12 = 9_999_999_999.99;
const hasAtMostTwoDecimals = (value: number) => /^\d+(\.\d{1,2})?$/.test(String(value));
const nonNegativeMoney = (max: number) => z.number().nonnegative('must be 0 or more')
  .max(max, 'is too large').refine(hasAtMostTwoDecimals, 'can have at most 2 decimal places');

export const createDistributionSchema = z.object({
  dist_date: z.iso.date('must be a date in YYYY-MM-DD format'),
  channel: z.enum(['keke', 'van']),
  recipient_name: z.string().trim().min(1, 'is required').max(120, 'must be 120 characters or fewer'),
  quantity_given: z.number().int('must be a whole number').positive('must be greater than 0').max(2_147_483_647, 'is too large'),
  price_per_bag: nonNegativeMoney(MAX_MONEY_10),
  amount_returned: nonNegativeMoney(MAX_MONEY_12).default(0),
});

export const addDistributionTransferSchema = z.object({
  transfer_date: z.iso.date('must be a date in YYYY-MM-DD format'),
  amount: nonNegativeMoney(MAX_MONEY_12).positive('must be greater than 0'),
  note: z.string().trim().max(255, 'must be 255 characters or fewer').nullish(),
});

export const listDistributionQuerySchema = z.object({
  channel: z.enum(['all', 'keke', 'van']).optional(),
});

export const distributionIdSchema = z.object({
  id: z.coerce.number().int('must be a whole number').positive('must be greater than 0'),
});

export type CreateDistributionInput = z.infer<typeof createDistributionSchema>;
export type AddDistributionTransferInput = z.infer<typeof addDistributionTransferSchema>;
export type ListDistributionQuery = z.infer<typeof listDistributionQuerySchema>;
