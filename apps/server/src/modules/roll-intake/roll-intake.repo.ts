import type { Kysely } from 'kysely';
import type { Database, NewRollIntake, RollIntake, UpdateRollIntake } from '../../database/types.js';
import { db } from '../../config/db.js';

/** Columns a caller may change. id and the timestamps are managed by the database. */
export type RollIntakeChanges = Omit<UpdateRollIntake, 'id' | 'created_at' | 'updated_at'>;

export interface RollIntakeListFilter {
    /** Inclusive lower bound on intake_date, 'YYYY-MM-DD'. */
    from?: string;
    /** Inclusive upper bound on intake_date, 'YYYY-MM-DD'. */
    to?: string;
    /** Keyset position: return only rows that come AFTER this one in the list order. */
    after?: { intake_date: string; id: number };
    limit: number;
}

/**
 * Data access only. total_price and balance are computed by the service layer
 * and passed in already calculated; the repository never does money math.
 *
 * It accepts any Kysely instance, so a service can run several repository
 * calls in one transaction: new RollIntakeRepository(trx).
 */
export class RollIntakeRepository {
    constructor(private readonly db: Kysely<Database>) {}

    async create(data: NewRollIntake): Promise<RollIntake> {
        // MySQL has no RETURNING, so insert and then read the row back by id.
        const result = await this.db
            .insertInto('roll_intake')
            .values(data)
            .executeTakeFirstOrThrow();

        return this.db
            .selectFrom('roll_intake')
            .selectAll()
            .where('id', '=', Number(result.insertId))
            .executeTakeFirstOrThrow();
    }

    /**
     * Newest first: intake_date DESC, then id DESC to break ties. The ORDER BY
     * and the keyset condition below use the same two columns, so a page boundary
     * is always exact.
     */
    async list(filter: RollIntakeListFilter): Promise<RollIntake[]> {
        let query = this.db.selectFrom('roll_intake').selectAll();

        if (filter.from) {
            query = query.where('intake_date', '>=', filter.from);
        }

        if (filter.to) {
            query = query.where('intake_date', '<=', filter.to);
        }

        if (filter.after) {
            const { intake_date, id } = filter.after;

            // "Strictly after (intake_date, id)" in a descending list.
            query = query.where((eb) =>
                eb.or([
                    eb('intake_date', '<', intake_date),
                    eb.and([eb('intake_date', '=', intake_date), eb('id', '<', id)]),
                ]),
            );
        }

        return query
            .orderBy('intake_date', 'desc')
            .orderBy('id', 'desc')
            .limit(filter.limit)
            .execute();
    }

    /** Returns undefined when no row has that id, so the service can answer 404. */
    async findById(id: number): Promise<RollIntake | undefined> {
        return this.db
            .selectFrom('roll_intake')
            .selectAll()
            .where('id', '=', id)
            .executeTakeFirst();
    }

    /**
     * Returns the updated row, or undefined if no row has that id.
     *
     * Derived columns must travel with their inputs: changing amount_paid means
     * passing balance too, and changing total_kg or price_per_kg means passing
     * total_price and balance. chk_roll_intake_balance rejects any row where
     * they disagree.
     */
    async update(id: number, changes: RollIntakeChanges): Promise<RollIntake | undefined> {
        // Kysely drops undefined values, and an empty SET clause is invalid SQL.
        if (Object.values(changes).every((value) => value === undefined)) {
            return this.findById(id);
        }

        await this.db
            .updateTable('roll_intake')
            .set(changes)
            .where('id', '=', id)
            .execute();

        return this.findById(id);
    }
}

export const rollIntakeRepository = new RollIntakeRepository(db);