import { Router } from 'express'
import { validate } from '../middlewares/validation.middleware.js'
import { registerUserSchema, loginUserSchema } from '../schemas/user.schema.js'
import { login, register, logout } from '../controllers/auth.controller.js'

export const authRouter = Router()

authRouter.post('/login', validate(loginUserSchema), login)
authRouter.post('/register', validate(registerUserSchema), register)
