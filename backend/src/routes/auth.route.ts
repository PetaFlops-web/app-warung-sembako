import { Router } from 'express'
import { login, register, logout } from '../controllers/auth.controller.js'
import { requireAuth } from '../middlewares/auth.js'

export const authRouter = Router()

authRouter.post('/login', login)
authRouter.post('/register', register)
authRouter.post('/logout', requireAuth, logout)
