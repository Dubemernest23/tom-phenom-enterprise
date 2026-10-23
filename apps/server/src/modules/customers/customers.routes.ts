import { Router } from 'express';
import { customersController } from './customers.controller.js';

export const customersRouter = Router();

customersRouter.get('/', customersController.list);
customersRouter.post('/', customersController.create);
customersRouter.get('/:id', customersController.getById);
customersRouter.post('/:id/transactions', customersController.addTransaction);
customersRouter.patch('/:id/transactions/:transactionId', customersController.updateTransaction);
