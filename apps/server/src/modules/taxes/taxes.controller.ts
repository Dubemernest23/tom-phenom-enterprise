import type { Request, Response } from 'express';
import { z } from 'zod';
import { BadRequestError } from '../../shared/appError.js';
import { taxIdSchema, taxRecordSchema } from './taxes.val.js';
import { taxesService } from './taxes.service.js';
const parse = <S extends z.ZodType>(s: S, d: unknown): z.output<S> => { const r = s.safeParse(d); if (!r.success) { const i = r.error.issues[0]; throw new BadRequestError(`${i?.path.join('.') || 'input'} ${i?.message || 'is invalid'}`); } return r.data as z.output<S>; };
export const taxesController = {
  async list(_req: Request, res: Response) { res.json(await taxesService.list()); },
  async get(req: Request, res: Response) { res.json(await taxesService.get(parse(taxIdSchema, req.params).id)); },
  async create(req: Request, res: Response) { res.status(201).json(await taxesService.create(parse(taxRecordSchema, req.body))); },
  async update(req: Request, res: Response) { res.json(await taxesService.update(parse(taxIdSchema, req.params).id, parse(taxRecordSchema, req.body))); },
};
