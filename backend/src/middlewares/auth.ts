import type { Request, Response, NextFunction } from 'express'
import jwt from 'jsonwebtoken'

interface JwtPayload {
  id: number
  role: string
}

declare global {
  namespace Express {
    interface Request {
      user?: JwtPayload
    }
  }
}

export function requireAuth(req: Request, res: Response, next: NextFunction): void {
  const token = req.cookies['token'] as string | undefined

  if (!token) {
    res.status(401).json({ message: 'Unauthorized. Silakan login terlebih dahulu.' })
    return
  }

  const jwtSecret = process.env['JWT_SECRET']
  if (!jwtSecret) {
    res.status(500).json({ message: 'Konfigurasi server tidak lengkap.' })
    return
  }

  try {
    const payload = jwt.verify(token, jwtSecret) as JwtPayload
    req.user = payload
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
