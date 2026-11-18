import express from 'express'
import cors from 'cors'
import helmet from 'helmet'
import cookieParser from 'cookie-parser'
import { authRouter } from './routes/auth.route.js'
import { categoryRouter } from './routes/category.route.js'
import { productRouter } from './routes/product.route.js'
import { errorHandler } from './middlewares/error.middleware.ts'

const app = express()

app.use(helmet())
app.use(cors({
  origin: process.env['FRONTEND_URL'],
  credentials: true,
}))
app.use(express.json())
app.use(cookieParser())

app.use('/api', authRouter)
app.use('/api', categoryRouter)
app.use('/api', productRouter)

app.use(errorHandler)

export { app }
