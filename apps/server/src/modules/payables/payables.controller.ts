import type { Request, Response } from 'express';
import { z } from 'zod';
import { BadRequestError } from '../../shared/appError.js';
import { payablesService } from './payables.service.js';
import { creditorIdSchema, createCreditorSchema, createPayableTransactionSchema } from './payables.val.js';

const parse = <S extends z.ZodType>(schema: S, data: unknown): z.output<S> => {
  const result = schema.safeParse(data);
  if (!result.success) {
    const issue = result.error.issues[0];
    const field = issue?.path.join('.');
    throw new BadRequestError(field ? `${field} ${issue?.message ?? 'is not valid'}` : issue?.message ?? 'is not valid');
  }
  return result.data as z.output<S>;
};
export const payablesController = {
  async list(_req: Request, res: Response) { res.json(await payablesService.list()); },
  async getById(req: Request, res: Response) {
    const { id } = parse(creditorIdSchema, req.params);
    res.json(await payablesService.getById(id));
  },
  async create(req: Request, res: Response) {
    res.status(201).json(await payablesService.create(parse(createCreditorSchema, req.body)));
  },
  async addTransaction(req: Request, res: Response) {
    const { id } = parse(creditorIdSchema, req.params);
    res.status(201).json(await payablesService.addTransaction(id, parse(createPayableTransactionSchema, req.body)));
  },
};
