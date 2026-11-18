import type { Request, Response, NextFunction } from 'express';
import { ClientError, ERROR_CODE, InternalServerError } from '../expectation/index.ts';

function buildKesalahan(message: string, details?: unknown): Array<Record<string, string>> {
  if (details && typeof details === 'object' && !Array.isArray(details)) {
    const entries = Object.entries(details as Record<string, unknown>);

    if (entries.length > 0) {
      return entries.map(([field, value]) => ({ [field]: String(value) }));
    }
  }

  return [{ message }];
}

export function errorHandler(
  err: unknown,
  _req: Request,
  res: Response,
  _next: NextFunction
): void {
  if (err instanceof ClientError || err instanceof InternalServerError) {
    res.status(err.statusCode).json({
      status: 'error',
      kode: err.kode,
      kesalahan: buildKesalahan(err.message, err instanceof ClientError ? err.details : undefined),
    });
    return;
  }

  res.status(500).json({
    status: 'error',
    kode: ERROR_CODE.INTERNAL_SERVER_ERROR,
    kesalahan: [{ message: 'Terjadi kesalahan pada server' }],
  });
}
