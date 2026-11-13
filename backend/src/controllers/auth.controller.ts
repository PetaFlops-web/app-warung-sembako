import type { Request, Response } from 'express'
import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import { z } from 'zod'
import { prisma } from '../lib/prisma.js'

const loginSchema = z.object({
  email: z.email(),
  password: z.string().min(6),
})

const registerSchema = z.object({
  name: z.string().min(1),
  email: z.email(),
  password: z.string().min(6),
})

export async function login(req: Request, res: Response): Promise<void> {
  const parsed = loginSchema.safeParse(req.body)
  if (!parsed.success) {
    res.status(400).json({ message: 'Input tidak valid', errors: parsed.error.flatten() })
    return
  }

  const { email, password } = parsed.data
  const user = await prisma.user.findUnique({ where: { email } })

  if (!user || !(await bcrypt.compare(password, user.password))) {
    res.status(401).json({ message: 'Email atau password salah.' })
    return
  }

  const jwtSecret = process.env['JWT_SECRET']
  if (!jwtSecret) throw new Error('JWT_SECRET tidak ditemukan di environment variables')

  const expiresIn = process.env['JWT_EXPIRES_IN']
  if (!expiresIn) throw new Error('JWT_EXPIRES_IN tidak ditemukan di environment variables')

  const cookieMaxAge = Number(process.env['JWT_COOKIE_MAX_AGE'])
  if (!cookieMaxAge) throw new Error('JWT_COOKIE_MAX_AGE tidak ditemukan di environment variables')

  const token = jwt.sign(
    { id: user.id, role: user.role },
    jwtSecret,
    { expiresIn } as jwt.SignOptions
  )

  res.cookie('token', token, {
    httpOnly: true,
    secure: process.env['NODE_ENV'] === 'production',
    sameSite: 'strict',
    maxAge: cookieMaxAge,
  })

  res.json({ id: user.id, name: user.name, role: user.role })
}

export async function register(req: Request, res: Response): Promise<void> {
  const parsed = registerSchema.safeParse(req.body)
  if (!parsed.success) {
    res.status(400).json({ message: 'Input tidak valid', errors: parsed.error.flatten() })
    return
  }

  const { name, email, password } = parsed.data

  const existing = await prisma.user.findUnique({ where: { email } })
  if (existing) {
    res.status(409).json({ message: 'Email sudah digunakan.' })
    return
  }

  const hashed = await bcrypt.hash(password, 10)
  const user = await prisma.user.create({
    data: { name, email, password: hashed, role: 'KEEPER' },
  })

  res.status(201).json({ id: user.id, name: user.name, email: user.email, role: user.role })
}

export async function logout(_req: Request, res: Response): Promise<void> {
  res.clearCookie('token')
  res.json({ message: 'Logout berhasil.' })
}
