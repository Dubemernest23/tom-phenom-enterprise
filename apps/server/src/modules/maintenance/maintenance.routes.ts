import { Router } from 'express';
import { notImplemented } from '../../utils/http';

export const maintenanceRouter = Router();

maintenanceRouter.get('/', notImplemented('Maintenance', 'list'));
maintenanceRouter.post('/', notImplemented('Maintenance', 'create'));
