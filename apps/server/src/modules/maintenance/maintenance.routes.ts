import { Router } from 'express';
import { notImplemented } from '../../utils/asyncHandler';

export const maintenanceRouter = Router();

maintenanceRouter.get('/', notImplemented('Maintenance', 'list'));
maintenanceRouter.post('/', notImplemented('Maintenance', 'create'));
