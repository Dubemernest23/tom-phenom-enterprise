import { Router } from 'express';
import { rollIntakeController } from './roll-intake.controller.js';

export const rollIntakeRouter = Router();

rollIntakeRouter.get('/', rollIntakeController.list);
rollIntakeRouter.post('/', rollIntakeController.create);
rollIntakeRouter.get('/:id', rollIntakeController.getById);
rollIntakeRouter.patch('/:id', rollIntakeController.update);