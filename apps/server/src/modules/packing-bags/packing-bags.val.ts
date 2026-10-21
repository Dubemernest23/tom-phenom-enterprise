import { z } from 'zod';

const dateField = z.iso.date('must be a date in YYYY-MM-DD format');
const positiveInt = z.number().int('must be a whole number').positive('must be greater than 0').max(2_147_483_647, 'is too large');

export const createPackingBagBatchSchema = z.object({
  received_date: dateField,
  quantity_received: positiveInt,
  note: z.string().trim().max(255, 'must be 255 characters or fewer').nullish(),
});

export const usePackingBagBatchSchema = z.object({
  usage_date: dateField,
  quantity_used: positiveInt,
});

export const packingBagIdSchema = z.object({
  id: z.coerce.number().int('must be a whole number').positive('must be greater than 0'),
});

export type CreatePackingBagBatchInput = z.infer<typeof createPackingBagBatchSchema>;
export type UsePackingBagBatchInput = z.infer<typeof usePackingBagBatchSchema>;
