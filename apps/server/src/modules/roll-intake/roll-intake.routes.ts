import { Router } from 'express';
import { rollIntakeController } from './roll-intake.controller.js';

export const rollIntakeRouter = Router();

rollIntakeRouter.get('/', rollIntakeController.list);
rollIntakeRouter.post('/', rollIntakeController.create);

// Must stay ABOVE '/:id'. Express matches routes in the order they are registered,
// so if '/:id' came first it would treat the word "summary" as an id and answer 400.
rollIntakeRouter.get('/summary', rollIntakeController.summary);

rollIntakeRouter.get('/:id', rollIntakeController.getById);
rollIntakeRouter.patch('/:id', rollIntakeController.update);