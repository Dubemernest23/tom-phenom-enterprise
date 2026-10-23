import { Router } from 'express';
import { distributionController } from './distribution.controller.js';

export const distributionRouter = Router();

distributionRouter.get('/', distributionController.list);
distributionRouter.post('/', distributionController.create);
distributionRouter.get('/:id', distributionController.getById);
distributionRouter.patch('/:id', distributionController.update);
distributionRouter.post('/:id/transfers', distributionController.addTransfer);
distributionRouter.post('/:id/calculate', distributionController.calculate);
