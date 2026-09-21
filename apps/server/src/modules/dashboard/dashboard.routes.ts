import { Router } from 'express';
import { notImplemented } from '../../utils/http';

export const dashboardRouter = Router();

dashboardRouter.get('/', notImplemented('Dashboard', 'summary'));
