import {Decimal} from 'decimal.js';
import { z } from 'zod';
import type { RollIntake } from '../../database/types.js';
import { BadRequestError, NotFoundError } from '../../shared/appError.js';
import { rollIntakeRepository, type RollIntakeRepository } from './roll-intake.repo.js';
import type {
    CreateRollIntakeInput,
    ListRollIntakeQuery,
    UpdateRollIntakeInput,
} from './roll-intake.val.js';

const MAX_MONEY = new Decimal('9999999999.99'); // DECIMAL(12,2)

// ---- Keyset cursor -------------------------------------------------------
// A cursor is the (intake_date, id) of the last row on a page, JSON-encoded and
// base64url'd so clients treat it as an opaque token. Anything that doesn't
// decode to exactly that shape is rejected.
const cursorSchema = z.object({
    d: z.iso.date(),
    i: z.number().int().positive(),
});

const encodeCursor = (row: Pick<RollIntake, 'intake_date' | 'id'>): string =>
    Buffer.from(JSON.stringify({ d: row.intake_date, i: row.id })).toString('base64url');

const decodeCursor = (cursor: string): { intake_date: string; id: number } => {
    try {
        const parsed = cursorSchema.parse(
            JSON.parse(Buffer.from(cursor, 'base64url').toString('utf8')),
        );
        return { intake_date: parsed.d, id: parsed.i };
    } catch {
        throw new BadRequestError('cursor is not valid');
    }
};

export interface RollIntakePage {
    items: RollIntake[];
    nextCursor: string | null;
}

export class RollIntakeService {
    constructor(private readonly repo: RollIntakeRepository) {}

    /** The one place the money math lives. Used by create and update. */
    private calculateTotals(
        totalKg: Decimal.Value,
        pricePerKg: Decimal.Value,
        amountPaid: Decimal.Value,
    ): { total_price: string; balance: string } {
        const totalPrice = new Decimal(totalKg)
            .mul(pricePerKg)
            .toDecimalPlaces(2, Decimal.ROUND_HALF_UP);
        const paid = new Decimal(amountPaid);

        if (totalPrice.gt(MAX_MONEY)) {
            throw new BadRequestError('Total price is too large.');
        }

        if (paid.gt(totalPrice)) {
            throw new BadRequestError("Amount paid can't be more than the total price.");
        }

        return {
            total_price: totalPrice.toFixed(2),
            balance: totalPrice.minus(paid).toFixed(2),
        };
    }

    async create(input: CreateRollIntakeInput): Promise<RollIntake> {
        const totals = this.calculateTotals(input.total_kg, input.price_per_kg, input.amount_paid);

        return this.repo.create({
            intake_date: input.intake_date,
            quantity_rolls: input.quantity_rolls,
            total_kg: input.total_kg,
            price_per_kg: input.price_per_kg,
            amount_paid: input.amount_paid,
            supplier_name: input.supplier_name || null,
            ...totals,
        });
    }

    /**
     * Keyset pagination: ask the repository for one row more than the page size.
     * If that extra row comes back, there is a next page, and the cursor points
     * at the last row we actually return.
     */
    async list(query: ListRollIntakeQuery): Promise<RollIntakePage> {
        const after = query.cursor ? decodeCursor(query.cursor) : undefined;

        const rows = await this.repo.list({
            from: query.from,
            to: query.to,
            after,
            limit: query.limit + 1,
        });

        const hasMore = rows.length > query.limit;
        const items = hasMore ? rows.slice(0, query.limit) : rows;
        const last = items[items.length - 1];

        return {
            items,
            nextCursor: hasMore && last ? encodeCursor(last) : null,
        };
    }

    async getById(id: number): Promise<RollIntake> {
        const row = await this.repo.findById(id);

        if (!row) {
            throw new NotFoundError('Roll intake record not found');
        }

        return row;
    }

    async update(id: number, input: UpdateRollIntakeInput): Promise<RollIntake> {
        const current = await this.getById(id);

        // Use the new value where one was sent, otherwise the stored one, then
        // recompute both derived columns and write them with the inputs.
        const totals = this.calculateTotals(
            input.total_kg ?? current.total_kg,
            input.price_per_kg ?? current.price_per_kg,
            input.amount_paid ?? current.amount_paid,
        );

        const { supplier_name, ...rest } = input;

        const updated = await this.repo.update(id, {
            ...rest,
            ...(supplier_name !== undefined ? { supplier_name: supplier_name || null } : {}),
            ...totals,
        });

        if (!updated) {
            throw new NotFoundError('Roll intake record not found');
        }

        return updated;
    }
}

export const rollIntakeService = new RollIntakeService(rollIntakeRepository);