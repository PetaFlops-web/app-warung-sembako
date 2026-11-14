import type { Request, Response, NextFunction } from 'express'
import type { JwtPayload } from '../types/auth.type.ts'
import TokenManager from '../utils/token-manager.ts'

export function requireAuthKeep(req: Request, res: Response, next: NextFunction): void {
  
  const authHeader = req.headers.authorization

  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    res.status(401).json({ message: 'Unauthorized. Silakan login terlebih dahulu.' })
    return
  }

  try {
    const payload = TokenManager.verifyAccessToken(token)

    if (typeof payload === 'string') {
      res.status(401).json({ message: 'Format token tidak valid.' });
      return;
    }

    req.user = payload as JwtPayload;
    
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
