import { Router } from 'express';
import { notImplemented } from '../../utils/asyncHandler.js';

export const dashboardRouter = Router();

dashboardRouter.get('/', notImplemented('Dashboard', 'summary'));
