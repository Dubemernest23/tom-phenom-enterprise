import type { Request, Response } from 'express';
import { z } from 'zod';
import { BadRequestError } from '../../shared/appError.js';
import { customersService } from './customers.service.js';
import { createCustomerSchema, createCustomerTransactionSchema, customerIdSchema, customerTransactionIdSchema } from './customers.val.js';

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

export const customersController = {
  async list(_req: Request, res: Response) { res.json(await customersService.list()); },
  async getById(req: Request, res: Response) {
    const { id } = parse(customerIdSchema, req.params);
    res.json(await customersService.getById(id));
  },
  async create(req: Request, res: Response) {
    const input = parse(createCustomerSchema, req.body);
    res.status(201).json(await customersService.create(input));
  },
  async addTransaction(req: Request, res: Response) {
    const { id } = parse(customerIdSchema, req.params);
    const input = parse(createCustomerTransactionSchema, req.body);
    res.status(201).json(await customersService.addTransaction(id, input));
  },
  async updateTransaction(req: Request, res: Response) {
    const { id } = parse(customerIdSchema, req.params);
    const { transactionId } = parse(customerTransactionIdSchema, req.params);
    const input = parse(createCustomerTransactionSchema, req.body);
    res.json(await customersService.updateTransaction(id, transactionId, input));
  },
};
