import { z } from 'zod';
import type { AdminService } from './auth.service.js';
import { asyncHandler } from '../../utils/asyncHandler.js';


const loginSchema = z.object({
  username: z.string().trim().min(1),
  password: z.string().min(1),
});
const createUserSchema = z.object({
  username: z.string().trim().min(3).max(100).regex(/^[a-zA-Z0-9._-]+$/),
  password: z.string().min(10).max(200),
  role: z.enum(['MANAGER', 'SUPERVISOR']),
});

export class AdminController {
  constructor(private readonly adminService: AdminService) {}

  login = asyncHandler(async (req, res) => {
    const parsed = loginSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: 'Username and password are required.' });
      return;
    }

    res.json(await this.adminService.login(parsed.data));
  });

  createUser = asyncHandler(async (req, res) => {
    const parsed = createUserSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: parsed.error.issues[0]?.message || 'User details are invalid.' });
      return;
    }
    res.status(201).json(await this.adminService.createPanelUser(parsed.data));
  });
}
