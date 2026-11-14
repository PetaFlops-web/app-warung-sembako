import type { Request, Response, NextFunction } from 'express';
import { ClientError } from '../expectation/index.ts';

export function errorHandler(
  err: unknown,
  _req: Request,
  res: Response,
  _next: NextFunction
): void {
  if (err instanceof ClientError) {
    res.status(err.statusCode).json({
      status: 'fail',
      message: err.message,
      ...(err.details ? { details: err.details } : {}),
    });
    return;
  }

  res.status(500).json({
    status: 'error',
    message: 'Terjadi kesalahan pada server',
  });
}
