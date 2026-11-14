import { Router } from 'express'
import { validate } from '../middlewares/validation.middleware.js'
import { createUserSchema } from '../schemas/user.schema.js'
import { login, register, logout } from '../controllers/auth.controller.js'

export const authRouter = Router()

authRouter.post('/login', login)
authRouter.post('/register', validate(createUserSchema), register)
