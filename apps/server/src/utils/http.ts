import type { RequestHandler } from 'express';

export const asyncHandler =
  (handler: RequestHandler): RequestHandler =>
  (req, res, next) => {
    Promise.resolve(handler(req, res, next)).catch(next);
  };

export const notImplemented = (moduleName: string, action: string): RequestHandler => {
  return (_req, res) => {
    res.status(501).json({
      error: `${moduleName} ${action} is not implemented yet.`,
    });
  };
};
