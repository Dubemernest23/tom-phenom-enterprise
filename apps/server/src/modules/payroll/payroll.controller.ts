import type { Request, Response } from 'express';
import { z } from 'zod';
import { BadRequestError } from '../../shared/appError.js';
import { payrollService } from './payroll.service.js';
import { createSalaryRecordSchema, createWorkerSchema, salaryRecordIdSchema, workerIdSchema } from './payroll.val.js';

const parse = <S extends z.ZodType>(schema: S, data: unknown): z.output<S> => {
  const result = schema.safeParse(data);
  if (!result.success) {
    const issue = result.error.issues[0];
    const field = issue?.path.join('.');
    const message = issue?.code === 'invalid_type' ? 'is missing or has the wrong type' : issue?.message ?? 'is not valid';
    throw new BadRequestError(field ? `${field} ${message}` : message);
  }
  return result.data as z.output<S>;
};

export const payrollController = {
  async list(_req: Request, res: Response) { res.json(await payrollService.list()); },
  async getById(req: Request, res: Response) {
    const { id } = parse(workerIdSchema, req.params);
    res.json(await payrollService.getById(id));
  },
  async create(req: Request, res: Response) {
    const input = parse(createWorkerSchema, req.body);
    res.status(201).json(await payrollService.create(input));
  },
  async addRecord(req: Request, res: Response) {
    const { id } = parse(workerIdSchema, req.params);
    const input = parse(createSalaryRecordSchema, req.body);
    res.status(201).json(await payrollService.addRecord(id, input));
  },
  async updateRecord(req: Request, res: Response) {
    const { id } = parse(workerIdSchema, req.params);
    const { recordId } = parse(salaryRecordIdSchema, req.params);
    const input = parse(createSalaryRecordSchema, req.body);
    res.json(await payrollService.updateRecord(id, recordId, input));
  },
};
