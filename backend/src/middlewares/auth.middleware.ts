import type { Request, Response, NextFunction } from 'express'
import type { JwtPayload } from '../types/auth.type.ts'
import { AuthenticationError, ForbiddenError } from '../expectation/index.ts'
import TokenManager, { ACCESS_TOKEN_TYPE } from '../utils/token-manager.ts'

function toJwtPayload(decoded: string | object): JwtPayload | null {

  if (typeof decoded === 'string') {
    return null;
  }

  const payload = decoded as Record<string, unknown>;
  const sub = payload['sub'];
  const role = payload['role'];

  if (typeof sub !== 'number' || typeof role !== 'string' || payload['typ'] !== ACCESS_TOKEN_TYPE) {
    return null;
  }

  return { sub, role };
}

export function requireAuth(req: Request, _res: Response, next: NextFunction): void {

  const authHeader = req.headers.authorization

  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    next(new AuthenticationError('Unauthorized. Silakan login terlebih dahulu.'))
    return
  }

  try {
    const payload = toJwtPayload(TokenManager.verifyAccessToken(token))

    if (!payload) {
      next(new AuthenticationError('Format token tidak valid.'));
      return;
    }

    req.user = payload;

    next()
  } catch {
    next(new AuthenticationError('Token tidak valid atau sudah kadaluarsa.'))
  }
}

export function requireOwner(req: Request, _res: Response, next: NextFunction): void {

  if (req.user?.role !== 'OWNER') {
    next(new ForbiddenError('Akses ditolak. Hanya Pemilik Warung yang dapat melakukan ini.'))
    return
  }

  next()
}
