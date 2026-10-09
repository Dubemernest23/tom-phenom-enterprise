import { z } from 'zod';
import type { AdminService } from './auth.service.js';
import { asyncHandler } from '../../utils/asyncHandler.js';


const loginSchema = z.object({
  username: z.string().trim().min(1),
  password: z.string().min(1),
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
}