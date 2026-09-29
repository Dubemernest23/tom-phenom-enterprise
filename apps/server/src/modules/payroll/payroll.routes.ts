import { Router } from 'express';
import { notImplemented } from '../../utils/http';

export const payrollRouter = Router();

payrollRouter.get('/', notImplemented('Payroll', 'list workers'));
payrollRouter.post('/', notImplemented('Payroll', 'create worker'));
payrollRouter.get('/:id', notImplemented('Payroll', 'worker detail'));
payrollRouter.post('/:id/records', notImplemented('Payroll', 'add salary record'));
