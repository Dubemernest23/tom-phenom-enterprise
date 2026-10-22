import { Router } from 'express';
import { inspectionsController } from './inspections.controller.js';
export const inspectionsRouter = Router();
inspectionsRouter.get('/', inspectionsController.list);
inspectionsRouter.post('/', inspectionsController.create);
inspectionsRouter.get('/:id', inspectionsController.get);
inspectionsRouter.patch('/:id', inspectionsController.update);
