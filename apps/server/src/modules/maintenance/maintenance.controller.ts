import type { Request, Response } from 'express';
import { z } from 'zod';
import { BadRequestError } from '../../shared/appError.js';
import { maintenanceService } from './maintenance.service.js';
import { createMaintenanceSchema } from './maintenance.val.js';

const parse = <S extends z.ZodType>(schema: S, data: unknown): z.output<S> => {
  const result = schema.safeParse(data);
  if (!result.success) {
    const issue = result.error.issues[0];
    const field = issue?.path.join('.');
    throw new BadRequestError(field ? `${field} ${issue?.message ?? 'is not valid'}` : issue?.message ?? 'is not valid');
  }
  return result.data as z.output<S>;
};

export const maintenanceController = {
  async list(_req: Request, res: Response) { res.json(await maintenanceService.list()); },
  async create(req: Request, res: Response) {
    const input = parse(createMaintenanceSchema, req.body);
    res.status(201).json(await maintenanceService.create(input));
  },
};
