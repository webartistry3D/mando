import type { Request, Response, NextFunction } from 'express';

export function success(res: Response, data: unknown, message?: string, status = 200) {
  return res.status(status).json({ success: true, data, message });
}

export function error(res: Response, code: string, message: string, status = 400, details?: unknown) {
  return res.status(status).json({
    success: false,
    error: { code, message, ...(details ? { details } : {}) },
  });
}

export function notFound(res: Response, resource = 'Resource') {
  return res.status(404).json({
    success: false,
    error: { code: 'NOT_FOUND', message: `${resource} not found` },
  });
}

export function asyncHandler(fn: (req: Request, res: Response, next: NextFunction) => Promise<unknown>) {
  return (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
}
