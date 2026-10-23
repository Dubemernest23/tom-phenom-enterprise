import type { Request, Response } from 'express';
import { z } from 'zod';
import { BadRequestError } from '../../shared/appError.js';
import { factoryLogService } from './factory-log.service.js';
import { createFactoryLogSchema, factoryLogIdSchema } from './factory-log.val.js';

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

export const factoryLogController = {
  async list(_req: Request, res: Response): Promise<void> {
    res.json(await factoryLogService.list());
  },
  async create(req: Request, res: Response): Promise<void> {
    const input = parse(createFactoryLogSchema, req.body);
    res.status(201).json(await factoryLogService.create(input));
  },
  async update(req: Request, res: Response): Promise<void> {
    const { id } = parse(factoryLogIdSchema, req.params);
    const input = parse(createFactoryLogSchema, req.body);
    res.json(await factoryLogService.update(id, input));
  },
};
