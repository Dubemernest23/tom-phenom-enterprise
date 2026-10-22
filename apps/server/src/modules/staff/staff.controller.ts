import type { Request, Response } from 'express';
import { z } from 'zod';
import { BadRequestError } from '../../shared/appError.js';
import { createWorkerSchema, staffRatingSchema, workerIdSchema } from '../payroll/payroll.val.js';
import { staffService } from './staff.service.js';

const parse = <S extends z.ZodType>(schema: S, data: unknown): z.output<S> => {
  const result = schema.safeParse(data);
  if (!result.success) {
    const issue = result.error.issues[0];
    const field = issue?.path.join('.');
    throw new BadRequestError(field ? `${field} ${issue?.message ?? 'is not valid'}` : issue?.message ?? 'is not valid');
  }
  return result.data as z.output<S>;
};
export const staffController = {
  async list(_req: Request, res: Response) { res.json(await staffService.list()); },
  async getById(req: Request, res: Response) { res.json(await staffService.getById(parse(workerIdSchema, req.params).id)); },
  async create(req: Request, res: Response) { res.status(201).json(await staffService.create(parse(createWorkerSchema, req.body))); },
  async update(req: Request, res: Response) {
    const id = parse(workerIdSchema, req.params).id;
    res.json(await staffService.update(id, parse(createWorkerSchema, req.body)));
  },
  async rate(req: Request, res: Response) {
    const id = parse(workerIdSchema, req.params).id;
    res.status(201).json(await staffService.rate(id, parse(staffRatingSchema, req.body)));
  },
};
