import { Router } from 'express';
import { payrollController } from './payroll.controller.js';

export const payrollRouter = Router();

payrollRouter.get('/', payrollController.list);
payrollRouter.post('/', payrollController.create);
payrollRouter.get('/:id', payrollController.getById);
payrollRouter.post('/:id/records', payrollController.addRecord);
payrollRouter.patch('/:id/records/:recordId', payrollController.updateRecord);
