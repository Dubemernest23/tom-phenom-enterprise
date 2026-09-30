import { Router } from 'express';
import { notImplemented } from '../../utils/asyncHandler';

export const payablesRouter = Router();

payablesRouter.get('/', notImplemented('Payables', 'list creditors'));
payablesRouter.post('/', notImplemented('Payables', 'create creditor'));
payablesRouter.get('/:id', notImplemented('Payables', 'creditor detail'));
payablesRouter.post('/:id/transactions', notImplemented('Payables', 'add transaction'));
