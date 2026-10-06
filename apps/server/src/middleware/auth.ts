import type { NextFunction, RequestHandler } from 'express';
import jwt from 'jsonwebtoken';
import { env } from '../config/env.js';
import { ne } from 'zod/locales';

type AuthTokenPayload = {
  sub: string;
  username: string;
  role: string;
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
      role: payload.role,
    };
    next();
  } catch {
    res.status(401).json({ error: 'Session expired. Please sign in again.' });
  }
};

export const requireAdminRole: RequestHandler = (req, res, next) => {
  if (req.user?.role !== 'ADMIN') {
    res.status(403).json({ error: 'Admins only.' });
    return;
  }
  next();
};

export const requireRoleCheck =  (...allowedRoles:string[]):RequestHandler =>{
  return (req,res,next) =>{
    if (!req.user || !allowedRoles.includes(req.user.role)){
      res.status(403).json({ error: 'You do not have access to this resource.' });
      return;
    }
    next();
  }
}