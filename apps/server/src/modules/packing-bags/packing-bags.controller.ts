import type { Request, Response } from 'express';
import { z } from 'zod';
import { BadRequestError } from '../../shared/appError.js';
import { packingBagsService } from './packing-bags.service.js';
import { createPackingBagBatchSchema, packingBagIdSchema, usePackingBagBatchSchema } from './packing-bags.val.js';

const parse = <S extends z.ZodType>(schema: S, data: unknown): z.output<S> => {
  const result = schema.safeParse(data);
  if (!result.success) {
    const issue = result.error.issues[0];
    const field = issue?.path.join('.');
    const message = issue?.code === 'invalid_type' ? 'is missing or has the wrong type' : (issue?.message ?? 'is not valid');
    throw new BadRequestError(field ? `${field} ${message}` : message);
  }
  return result.data as z.output<S>;
};

export const packingBagsController = {
  async list(_req: Request, res: Response): Promise<void> {
    res.json(await packingBagsService.list());
  },
  async create(req: Request, res: Response): Promise<void> {
    const input = parse(createPackingBagBatchSchema, req.body);
    res.status(201).json(await packingBagsService.create(input));
  },
  async use(req: Request, res: Response): Promise<void> {
    const { id } = parse(packingBagIdSchema, req.params);
    const input = parse(usePackingBagBatchSchema, req.body);
    res.json(await packingBagsService.use(id, input));
  },
};
