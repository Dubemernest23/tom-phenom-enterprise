import type { RequestHandler } from 'express';
import jwt from 'jsonwebtoken';
import { env } from '../config/env';

type AuthTokenPayload = {
  sub: string;
  username: string;
};

export const requireAuth: RequestHandler = (req, res, next) => {
  const header = req.get('Authorization');

  if (!header || !header.startsWith('Bearer ')) {
    res.status(401).json({ error: 'Sign in is required.' });
    return;
  }

  try {
    const token = header.slice('Bearer '.length);
    const payload = jwt.verify(token, env.jwtSecret) as AuthTokenPayload;
    req.user = {
      id: payload.sub,
      username: payload.username,
    };
    next();
  } catch {
    res.status(401).json({ error: 'Session expired. Please sign in again.' });
  }
};
