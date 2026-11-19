import { Router } from 'express'
import { validate } from '../middlewares/validation.middleware.js'
import { registerUserSchema, loginUserSchema, refreshTokenSchema } from '../schemas/user.schema.js'
import { login, register, refresh, logout, me } from '../controllers/auth.controller.js'
import { requireAuth } from '../middlewares/auth.middleware.js'

export const authRouter = Router()

authRouter.post('/login', validate(loginUserSchema), login)
authRouter.post('/register', validate(registerUserSchema), register)
authRouter.post('/refresh', validate(refreshTokenSchema), refresh)
authRouter.post('/logout', requireAuth, validate(refreshTokenSchema), logout)
authRouter.get('/me', requireAuth, me)
