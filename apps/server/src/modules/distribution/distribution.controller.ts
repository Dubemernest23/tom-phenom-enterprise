import type { Request, Response } from 'express';
import { z } from 'zod';
import { BadRequestError } from '../../shared/appError.js';
import { distributionService } from './distribution.service.js';
import { addDistributionTransferSchema, createDistributionSchema, distributionIdSchema, listDistributionQuerySchema } from './distribution.val.js';

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

export const distributionController = {
  async list(req: Request, res: Response): Promise<void> {
    const query = parse(listDistributionQuerySchema, req.query);
    res.json(await distributionService.list(query));
  },
  async create(req: Request, res: Response): Promise<void> {
    const input = parse(createDistributionSchema, req.body);
    res.status(201).json(await distributionService.create(input));
  },
  async getById(req: Request, res: Response): Promise<void> {
    const { id } = parse(distributionIdSchema, req.params);
    res.json(await distributionService.getById(id));
  },
  async update(req: Request, res: Response): Promise<void> {
    const { id } = parse(distributionIdSchema, req.params);
    const input = parse(createDistributionSchema, req.body);
    res.json(await distributionService.update(id, input));
  },
  async addTransfer(req: Request, res: Response): Promise<void> {
    const { id } = parse(distributionIdSchema, req.params);
    const input = parse(addDistributionTransferSchema, req.body);
    res.status(201).json(await distributionService.addTransfer(id, input));
  },
  async calculate(req: Request, res: Response): Promise<void> {
    const { id } = parse(distributionIdSchema, req.params);
    res.json(await distributionService.calculate(id));
  },
};
