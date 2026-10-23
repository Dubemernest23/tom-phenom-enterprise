import { Router } from 'express';
import { staffController } from './staff.controller.js';

export const staffRouter = Router();
staffRouter.get('/', staffController.list);
staffRouter.post('/', staffController.create);
staffRouter.get('/:id', staffController.getById);
staffRouter.patch('/:id', staffController.update);
staffRouter.post('/:id/ratings', staffController.rate);
