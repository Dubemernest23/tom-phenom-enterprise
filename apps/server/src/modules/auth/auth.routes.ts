import { Router } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { z } from 'zod';
import { env } from '../../config/env';
import { asyncHandler } from '../../utils/asyncHandler';

const loginSchema = z.object({
  username: z.string().min(1),
  password: z.string().min(1),
});

export const authRouter = Router();

authRouter.post('/login', asyncHandler(async (req, res) => {
  const credentials = loginSchema.parse(req.body);
  const usernameMatches = credentials.username === env.ownerUsername;
  const passwordMatches = env.ownerPassword.startsWith('$2')
    ? await bcrypt.compare(credentials.password, env.ownerPassword)
    : credentials.password === env.ownerPassword;

  if (!usernameMatches || !passwordMatches) {
    res.status(401).json({ error: 'Invalid username or password.' });
    return;
  }

  const user = { id: 'owner', username: env.ownerUsername };
  const token = jwt.sign(
    { sub: user.id, username: user.username },
    env.jwtSecret,
    { expiresIn: '7d' },
  );

  res.json({ token, user });
}));

authRouter.post('/logout', (_req, res) => {
  res.status(204).send();
});
