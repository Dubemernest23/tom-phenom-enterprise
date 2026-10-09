import { Router } from 'express';
import { notImplemented } from '../../utils/asyncHandler';

export const customersRouter = Router();

customersRouter.get('/', notImplemented('Customers', 'list'));
customersRouter.post('/', notImplemented('Customers', 'create'));
customersRouter.get('/:id', notImplemented('Customers', 'detail'));
customersRouter.post('/:id/transactions', notImplemented('Customers', 'add transaction'));
