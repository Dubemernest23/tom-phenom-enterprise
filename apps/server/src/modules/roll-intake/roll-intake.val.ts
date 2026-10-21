import { z } from 'zod';

// Money arrives as JSON numbers. At most 2 decimal places are allowed so the value
// stored in a DECIMAL(x,2) column is exactly what the user typed. The check looks at
// the text form of the number, which avoids float traps like 0.07 * 100 !== 7.
const hasAtMostTwoDecimals = (value: number): boolean =>
    /^\d+(\.\d{1,2})?$/.test(String(value));

const MAX_KG = 99_999_999.99; // DECIMAL(10,2)
const MAX_MONEY = 9_999_999_999.99; // DECIMAL(12,2)

const positiveMoney = (max: number) =>
    z
        .number()
        .positive('must be greater than 0')
        .max(max, 'is too large')
        .refine(hasAtMostTwoDecimals, 'can have at most 2 decimal places');

const nonNegativeMoney = (max: number) =>
    z
        .number()
        .nonnegative('must be 0 or more')
        .max(max, 'is too large')
        .refine(hasAtMostTwoDecimals, 'can have at most 2 decimal places');

const dateField = z.iso.date('must be a date in YYYY-MM-DD format');

// Shared field definitions. amount_paid has NO default here on purpose: in Zod 4 a
// default inside .partial() is still applied, so a PATCH body without amount_paid
// would silently reset it to 0. The default is added only for create, below.
//
// amount_paid is allowed to be MORE or LESS than the delivery is worth. The
// difference is the signed balance: positive means you owe the supplier, negative
// means the supplier owes you.
const fields = {
    intake_date: dateField,
    quantity_rolls: z
        .number()
        .int('must be a whole number')
        .positive('must be greater than 0')
        .max(2_147_483_647, 'is too large'),
    total_kg: positiveMoney(MAX_KG),
    price_per_kg: nonNegativeMoney(MAX_MONEY),
    amount_paid: nonNegativeMoney(MAX_MONEY),
    supplier_name: z.string().trim().max(120, 'must be 120 characters or fewer').nullish(),
};

// total_price and balance are deliberately absent: the server computes them.
export const createRollIntakeSchema = z.object({
    ...fields,
    amount_paid: fields.amount_paid.default(0),
});

export const updateRollIntakeSchema = z
    .object(fields)
    .partial()
    .refine(
        (body) => Object.values(body).some((value) => value !== undefined),
        'provide at least one field to update',
    );

export const idParamSchema = z.object({
    id: z.coerce.number().int('must be a whole number').positive('must be greater than 0'),
});

// from and to are inclusive. YYYY-MM-DD strings compare correctly as plain text.
const dateRange = {
    from: dateField.optional(),
    to: dateField.optional(),
};

const rangeIsOrdered = (range: { from?: string | undefined; to?: string | undefined }): boolean =>
    !range.from || !range.to || range.from <= range.to;

const rangeIssue = { message: '"from" must not be after "to"', path: ['from'] };

export const listRollIntakeQuerySchema = z
    .object({
        ...dateRange,
        limit: z.coerce
            .number()
            .int('must be a whole number')
            .min(1, 'must be at least 1')
            .max(100, 'must be 100 or fewer')
            .default(20),
        cursor: z.string().min(1).optional(),
    })
    .refine(rangeIsOrdered, rangeIssue);

export const summaryRollIntakeQuerySchema = z.object(dateRange).refine(rangeIsOrdered, rangeIssue);

export type CreateRollIntakeInput = z.infer<typeof createRollIntakeSchema>;
export type UpdateRollIntakeInput = z.infer<typeof updateRollIntakeSchema>;
export type ListRollIntakeQuery = z.infer<typeof listRollIntakeQuerySchema>;
export type SummaryRollIntakeQuery = z.infer<typeof summaryRollIntakeQuerySchema>;