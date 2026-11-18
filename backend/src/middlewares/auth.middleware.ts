import type { Request, Response, NextFunction } from 'express'
import type { JwtPayload } from '../types/auth.type.ts'
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

export function requireAuth(req: Request, res: Response, next: NextFunction): void {

  const authHeader = req.headers.authorization

  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    res.status(401).json({ message: 'Unauthorized. Silakan login terlebih dahulu.' })
    return
  }

  try {
    const payload = toJwtPayload(TokenManager.verifyAccessToken(token))

    if (!payload) {
      res.status(401).json({ message: 'Format token tidak valid.' });
      return;
    }

    req.user = payload;

    next()
  } catch {
    res.status(401).json({ message: 'Token tidak valid atau sudah kadaluarsa.' })
  }
}

export function requireOwner(req: Request, res: Response, next: NextFunction): void {

  if (req.user?.role !== 'OWNER') {
    res.status(403).json({ message: 'Akses ditolak. Hanya Pemilik Warung yang dapat melakukan ini.' })
    return
  }

  next()
}
