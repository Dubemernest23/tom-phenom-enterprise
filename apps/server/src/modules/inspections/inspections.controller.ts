import type { Request, Response } from 'express';
import { z } from 'zod';
import { BadRequestError } from '../../shared/appError.js';
import { inspectionIdSchema, inspectionSchema } from './inspections.val.js';
import { inspectionsService } from './inspections.service.js';
const parse = <S extends z.ZodType>(s: S, d: unknown): z.output<S> => { const r = s.safeParse(d); if (!r.success) { const i = r.error.issues[0]; throw new BadRequestError(`${i?.path.join('.') || 'input'} ${i?.message || 'is invalid'}`); } return r.data as z.output<S>; };
export const inspectionsController = {
  async list(_req: Request, res: Response) { res.json(await inspectionsService.list()); },
  async get(req: Request, res: Response) { res.json(await inspectionsService.get(parse(inspectionIdSchema, req.params).id)); },
  async create(req: Request, res: Response) { res.status(201).json(await inspectionsService.create(parse(inspectionSchema, req.body))); },
  async update(req: Request, res: Response) { res.json(await inspectionsService.update(parse(inspectionIdSchema, req.params).id, parse(inspectionSchema, req.body))); },
};
