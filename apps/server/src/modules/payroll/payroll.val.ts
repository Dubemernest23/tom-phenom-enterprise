import { z } from 'zod';

const MAX_MONEY = 9_999_999_999.99;
const money = z.number().nonnegative('must be 0 or more').max(MAX_MONEY, 'is too large')
  .refine((value) => /^\d+(\.\d{1,2})?$/.test(String(value)), 'can have at most 2 decimal places');

export const workerIdSchema = z.object({ id: z.coerce.number().int().positive() });
export const salaryRecordIdSchema = z.object({ recordId: z.coerce.number().int().positive() });
export const createWorkerSchema = z.object({
  name: z.string().trim().min(1, 'is required').max(120, 'must be 120 characters or fewer'),
  role: z.string().trim().max(80, 'must be 80 characters or fewer').nullish(),
  base_salary: money.nullable().optional(),
  state_of_origin: z.string().trim().max(40).nullish(),
  start_date: z.iso.date('must be a date in YYYY-MM-DD format'),
  salary_frequency: z.enum(['weekly', 'monthly', 'daily']),
  rvs_status: z.enum(['not_tested', 'negative', 'positive']).default('not_tested'),
  hepatitis_b_status: z.enum(['not_tested', 'negative', 'positive']).default('not_tested'),
  hepatitis_c_status: z.enum(['not_tested', 'negative', 'positive']).default('not_tested'),
  vdrl_status: z.enum(['not_tested', 'negative', 'positive']).default('not_tested'),
  genotype: z.string().trim().max(5).nullish(),
  blood_group: z.string().trim().max(5).nullish(),
}).superRefine((worker, ctx) => {
  if (worker.salary_frequency === 'monthly' && (!worker.base_salary || worker.base_salary <= 0)) {
    ctx.addIssue({ code: 'custom', path: ['base_salary'], message: 'must be greater than 0 for monthly salaried staff' });
  }
  if (worker.salary_frequency !== 'monthly' && worker.base_salary != null && worker.base_salary !== 0) {
    ctx.addIssue({ code: 'custom', path: ['base_salary'], message: 'must be blank for weekly and daily workers; pay is entered per period worked' });
  }
});
export const createSalaryRecordSchema = z.object({
  pay_period: z.string().trim().min(1, 'is required').max(20),
  due_date: z.iso.date('must be a date in YYYY-MM-DD format'),
  salary_due: money,
  advance: money.default(0),
  amount_paid: money.default(0),
});
export type CreateWorkerInput = z.infer<typeof createWorkerSchema>;
export type CreateSalaryRecordInput = z.infer<typeof createSalaryRecordSchema>;
export const staffRatingSchema = z.object({
  rating_month: z.iso.date('must be a date in YYYY-MM-DD format'),
  rating: z.number().min(1).max(5).refine((n) => /^\d+(\.\d)?$/.test(String(n)), 'must be from 1 to 5 with at most one decimal place'),
  note: z.string().trim().max(255).nullish(),
});
export const staffRatingIdSchema = z.object({ id: z.coerce.number().int().positive() });
export type StaffRatingInput = z.infer<typeof staffRatingSchema>;
