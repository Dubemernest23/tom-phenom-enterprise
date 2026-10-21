import type { Request, Response } from 'express';
import { z } from 'zod';
import { BadRequestError } from '../../shared/appError.js';
import { rollIntakeService } from './roll-intake.service.js';
import {
    createRollIntakeSchema,
    idParamSchema,
    listRollIntakeQuerySchema,
    summaryRollIntakeQuerySchema,
    updateRollIntakeSchema,
} from './roll-intake.val.js';

/**
 * Validates data against a schema and turns the first problem into a plain
 * 400 message, e.g. "total_kg must be greater than 0".
 */
const parse = <S extends z.ZodType>(schema: S, data: unknown): z.output<S> => {
    const result = schema.safeParse(data);

    if (!result.success) {
        const issue = result.error.issues[0];
        const field = issue?.path.join('.');
        const message =
            issue?.code === 'invalid_type'
                ? 'is missing or has the wrong type'
                : (issue?.message ?? 'is not valid');

        throw new BadRequestError(field ? `${field} ${message}` : message);
    }

    // Inside a generic function TypeScript only knows the constraint, so the output type is asserted.
    return result.data as z.output<S>;
};

// Express 5 forwards errors from async handlers to the error middleware itself,
// so no try/catch or wrapper is needed here.
export const rollIntakeController = {
    async create(req: Request, res: Response): Promise<void> {
        const input = parse(createRollIntakeSchema, req.body);
        const record = await rollIntakeService.create(input);
        res.status(201).json(record);
    },

    async list(req: Request, res: Response): Promise<void> {
        const query = parse(listRollIntakeQuerySchema, req.query);
        res.json(await rollIntakeService.list(query));
    },

    async summary(req: Request, res: Response): Promise<void> {
        const query = parse(summaryRollIntakeQuerySchema, req.query);
        res.json(await rollIntakeService.summary(query));
    },

    async getById(req: Request, res: Response): Promise<void> {
        const { id } = parse(idParamSchema, req.params);
        res.json(await rollIntakeService.getById(id));
    },

    async update(req: Request, res: Response): Promise<void> {
        const { id } = parse(idParamSchema, req.params);
        const input = parse(updateRollIntakeSchema, req.body);
        res.json(await rollIntakeService.update(id, input));
    },
};