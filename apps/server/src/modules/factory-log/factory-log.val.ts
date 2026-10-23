import { z } from 'zod';

const maxInt = 2_147_483_647;
const nonNegativeInt = z.number()
  .int('must be a whole number')
  .min(0, 'must be 0 or more')
  .max(maxInt, 'is too large');

export const createFactoryLogSchema = z.object({
  log_date: z.iso.date('must be a date in YYYY-MM-DD format'),
  opening_stock: nonNegativeInt,
  closing_stock: nonNegativeInt,
  distribution_qty: nonNegativeInt,
  in_house_qty: nonNegativeInt,
});

export const factoryLogIdSchema = z.object({
  id: z.coerce.number().int('must be a whole number').positive('must be greater than 0'),
});

export type CreateFactoryLogInput = z.infer<typeof createFactoryLogSchema>;
