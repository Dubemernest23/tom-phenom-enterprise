import { Router } from 'express';
import { packingBagsController } from './packing-bags.controller.js';

export const packingBagsRouter = Router();

packingBagsRouter.get('/', packingBagsController.list);
packingBagsRouter.post('/', packingBagsController.create);
packingBagsRouter.post('/:id/use', packingBagsController.use);
packingBagsRouter.get('/:id', packingBagsController.getById);
