import { Router } from 'express';
import { db } from '../../config/db.js';
import { AdminRepository } from './auth.repo.js';
import { AdminService } from './auth.service.js';
import { AdminController } from './auth.controller.js';
import { requireAuth, requireRoleCheck } from '../../middleware/auth.js';

const controller = new AdminController(new AdminService(new AdminRepository(db)));

export const authRouter = Router();
authRouter.post('/login', controller.login);
authRouter.post('/users', requireAuth, requireRoleCheck('ADMIN'), controller.createUser);
