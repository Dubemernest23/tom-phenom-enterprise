import type { ErrorRequestHandler, RequestHandler } from 'express';
import { ZodError } from 'zod';
import { env } from '../config/env';

export const notFoundHandler: RequestHandler = (req, res) => {
  res.status(404).json({ error: `Route not found: ${req.method} ${req.originalUrl}` });
};

export const errorHandler: ErrorRequestHandler = (err, _req, res, _next) => {
  if (err instanceof ZodError) {
    res.status(400).json({
      error: 'Invalid request data.',
      issues: err.issues,
    });
    return;
  }

  const message = err instanceof Error ? err.message : 'Internal server error.';
  res.status(500).json({
    error: env.nodeEnv === 'production' ? 'Internal server error.' : message,
  });
};
