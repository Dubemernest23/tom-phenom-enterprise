import type { RequestHandler } from 'express';
import jwt from 'jsonwebtoken';
import { env } from '../config/env.js';

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

const SUPERVISOR_RESTRICTED_PATHS = ['/api/staff', '/api/payroll', '/api/payables'];

/** Enforces panel roles for every protected API, including routes added later. */
export const enforcePanelAccess: RequestHandler = (req, res, next) => {
  const role = req.user?.role?.toUpperCase();
  if (!role || !['ADMIN', 'MANAGER', 'SUPERVISOR'].includes(role)) {
    res.status(403).json({ error: 'Your account does not have access to this resource.' });
    return;
  }

  const path = `/api${req.path}`;
  if (role === 'SUPERVISOR' && SUPERVISOR_RESTRICTED_PATHS.some((prefix) => path === prefix || path.startsWith(`${prefix}/`))) {
    res.status(403).json({ error: 'This section is restricted for supervisor accounts.' });
    return;
  }

  if (role !== 'ADMIN' && !['GET', 'HEAD', 'OPTIONS'].includes(req.method)) {
    res.status(403).json({ error: 'This account has read-only access.' });
    return;
  }

  next();
};
