import { Router } from 'express';
import { notImplemented } from '../../utils/http';

export const distributionRouter = Router();

distributionRouter.get('/', notImplemented('Distribution', 'list'));
distributionRouter.post('/', notImplemented('Distribution', 'create'));
