import { Router } from 'express';
import { notImplemented } from '../../utils/asyncHandler.js';

export const distributionRouter = Router();

distributionRouter.get('/', notImplemented('Distribution', 'list'));
distributionRouter.post('/', notImplemented('Distribution', 'create'));
