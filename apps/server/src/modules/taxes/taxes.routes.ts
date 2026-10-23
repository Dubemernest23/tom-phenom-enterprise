import { Router } from 'express';
import { taxesController } from './taxes.controller.js';
export const taxesRouter = Router();
taxesRouter.get('/', taxesController.list);
taxesRouter.post('/', taxesController.create);
taxesRouter.get('/:id', taxesController.get);
taxesRouter.patch('/:id', taxesController.update);
