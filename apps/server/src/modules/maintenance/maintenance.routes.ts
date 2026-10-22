import { Router } from 'express';
import { maintenanceController } from './maintenance.controller.js';

export const maintenanceRouter = Router();

maintenanceRouter.get('/', maintenanceController.list);
maintenanceRouter.post('/', maintenanceController.create);
