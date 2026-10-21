import { Router } from 'express';
import { factoryLogController } from './factory-log.controller.js';

export const factoryLogRouter = Router();

factoryLogRouter.get('/', factoryLogController.list);
factoryLogRouter.post('/', factoryLogController.create);
