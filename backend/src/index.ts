import express, { Express, Request, Response } from 'express'
import cors from 'cors'
import helmet from 'helmet'
import morgan from 'morgan'
import cookieParser from 'cookie-parser'
import dotenv from 'dotenv'
import routes from './routes'

// Load environment variables
dotenv.config()

const app: Express = express()
const PORT = process.env.PORT || 3000

// Middleware
app.use(helmet())
app.use(cors({
  origin: process.env.CORS_ORIGIN || 'http://localhost:5173',
  credentials: true,
}))
app.use(morgan('dev'))
app.use(express.json())
app.use(express.urlencoded({ extended: true }))
app.use(cookieParser())

// Health check endpoint
app.get('/health', (req: Request, res: Response) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    service: 'demand-letter-backend',
  })
})

// API routes
app.use('/api', routes)

// Error handling middleware
app.use((err: Error, req: Request, res: Response, next: any) => {
  console.error(err.stack)
  res.status(500).json({
    error: {
      code: 'INTERNAL_SERVER_ERROR',
      message: process.env.NODE_ENV === 'production' 
        ? 'An error occurred' 
        : err.message,
    },
  })
})

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`)
  console.log(`📝 Health check: http://localhost:${PORT}/health`)
  console.log(`🌍 Environment: ${process.env.NODE_ENV || 'development'}`)
})

export default app

