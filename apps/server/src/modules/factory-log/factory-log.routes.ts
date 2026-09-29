import { Router } from 'express';
import { notImplemented } from '../../utils/http';

export const factoryLogRouter = Router();

factoryLogRouter.get('/', notImplemented('Factory log', 'list'));
factoryLogRouter.post('/', notImplemented('Factory log', 'create'));
