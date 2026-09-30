import { Router } from 'express';
import { notImplemented } from '../../utils/asyncHandler';

export const dashboardRouter = Router();

dashboardRouter.get('/', notImplemented('Dashboard', 'summary'));
