import { Decimal } from 'decimal.js';
import { z } from 'zod';
import type { RollIntake } from '../../database/types.js';
import { BadRequestError, NotFoundError } from '../../shared/appError.js';
import { rollIntakeRepository, type RollIntakeRepository } from './roll-intake.repo.js';
import type {
    CreateRollIntakeInput,
    ListRollIntakeQuery,
    SummaryRollIntakeQuery,
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

/** Who owes whom, seen from your side. */
export type RollIntakePosition = 'you_owe' | 'supplier_owes_you' | 'settled';

export interface RollIntakeSummary {
    /** Number of roll intake records in the range. */
    entries: number;
    /** What the deliveries were worth: SUM(total_price). */
    total_value: string;
    /** What you paid: SUM(amount_paid). */
    total_paid: string;
    /** total_value - total_paid. Positive: you owe the supplier. Negative: the supplier owes you. */
    net_balance: string;
    position: RollIntakePosition;
    /** Absolute size of net_balance, ready to display next to the position. */
    amount: string;
}

export class RollIntakeService {
    constructor(private readonly repo: RollIntakeRepository) {}

    /**
     * The one place the money math lives. Used by create and update.
     *
     * balance is SIGNED. Paying more than a delivery is worth is allowed (the
     * supplier now owes you, so balance is negative) and so is paying less (you
     * owe the supplier, so balance is positive).
     */
    private calculateTotals(
        totalKg: Decimal.Value,
        pricePerKg: Decimal.Value,
        amountPaid: Decimal.Value,
    ): { total_price: string; balance: string } {
        const totalPrice = new Decimal(totalKg)
            .mul(pricePerKg)
            .toDecimalPlaces(2, Decimal.ROUND_HALF_UP);

        if (totalPrice.gt(MAX_MONEY)) {
            throw new BadRequestError('Total price is too large.');
        }

        return {
            total_price: totalPrice.toFixed(2),
            balance: totalPrice.minus(amountPaid).toFixed(2),
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

    /**
     * Running position with the supplier. With no dates it covers every record,
     * which is what is owed right now. With a date range it only describes the
     * activity inside that range.
     */
    async summary(query: SummaryRollIntakeQuery): Promise<RollIntakeSummary> {
        const totals = await this.repo.summarize({ from: query.from, to: query.to });
        const net = new Decimal(totals.net_balance ?? 0);

        return {
            entries: Number(totals.entries),
            total_value: new Decimal(totals.total_value ?? 0).toFixed(2),
            total_paid: new Decimal(totals.total_paid ?? 0).toFixed(2),
            net_balance: net.toFixed(2),
            position: net.gt(0) ? 'you_owe' : net.lt(0) ? 'supplier_owes_you' : 'settled',
            amount: net.abs().toFixed(2),
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