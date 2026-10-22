import { Router } from 'express';
import { payablesController } from './payables.controller.js';

export const payablesRouter = Router();

payablesRouter.get('/', payablesController.list);
payablesRouter.post('/', payablesController.create);
payablesRouter.get('/:id', payablesController.getById);
payablesRouter.post('/:id/transactions', payablesController.addTransaction);
