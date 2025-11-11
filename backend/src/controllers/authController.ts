import { Request, Response } from 'express'
import { z } from 'zod'
import AuthService from '../services/AuthService'

// Validation schemas
const registerSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  firstName: z.string().min(1, 'First name is required'),
  lastName: z.string().min(1, 'Last name is required'),
  role: z.enum(['attorney', 'paralegal', 'viewer']).optional(),
})

const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(1, 'Password is required'),
})

const refreshSchema = z.object({
  refreshToken: z.string().min(1, 'Refresh token is required'),
})

class AuthController {
  async register(req: Request, res: Response) {
    try {
      // Validate input
      const validated = registerSchema.parse(req.body)

      // Register user
      const result = await AuthService.register(validated)

      // Set refresh token in httpOnly cookie
      res.cookie('refreshToken', result.refreshToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
      })

      // Return response
      res.status(201).json({
        data: {
          user: result.user,
          accessToken: result.accessToken,
        },
      })
    } catch (error: any) {
      if (error.name === 'ZodError') {
        return res.status(400).json({
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Invalid input',
            details: error.errors,
          },
        })
      }

      if (error.message === 'User with this email already exists') {
        return res.status(409).json({
          error: {
            code: 'USER_EXISTS',
            message: error.message,
          },
        })
      }

      console.error('Registration error:', error)
      res.status(500).json({
        error: {
          code: 'REGISTRATION_ERROR',
          message: 'Error creating user account',
        },
      })
    }
  }

  async login(req: Request, res: Response) {
    try {
      // Validate input
      const validated = loginSchema.parse(req.body)

      // Login user
      const result = await AuthService.login(validated)

      // Set refresh token in httpOnly cookie
      res.cookie('refreshToken', result.refreshToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
      })

      // Return response
      res.json({
        data: {
          user: result.user,
          accessToken: result.accessToken,
        },
      })
    } catch (error: any) {
      if (error.name === 'ZodError') {
        return res.status(400).json({
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Invalid input',
            details: error.errors,
          },
        })
      }

      if (error.message === 'Invalid email or password') {
        return res.status(401).json({
          error: {
            code: 'INVALID_CREDENTIALS',
            message: error.message,
          },
        })
      }

      console.error('Login error:', error)
      res.status(500).json({
        error: {
          code: 'LOGIN_ERROR',
          message: 'Error logging in',
        },
      })
    }
  }

  async refresh(req: Request, res: Response) {
    try {
      // Get refresh token from cookie or body
      const refreshToken = req.cookies?.refreshToken || req.body.refreshToken

      if (!refreshToken) {
        return res.status(401).json({
          error: {
            code: 'NO_REFRESH_TOKEN',
            message: 'No refresh token provided',
          },
        })
      }

      // Refresh tokens
      const result = await AuthService.refresh(refreshToken)

      // Set new refresh token in httpOnly cookie
      res.cookie('refreshToken', result.refreshToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
      })

      // Return response
      res.json({
        data: {
          user: result.user,
          accessToken: result.accessToken,
        },
      })
    } catch (error: any) {
      console.error('Refresh error:', error)
      res.status(401).json({
        error: {
          code: 'REFRESH_ERROR',
          message: 'Invalid or expired refresh token',
        },
      })
    }
  }

  async logout(req: Request, res: Response) {
    try {
      // Clear refresh token cookie
      res.clearCookie('refreshToken')

      res.json({
        data: {
          message: 'Logged out successfully',
        },
      })
    } catch (error) {
      console.error('Logout error:', error)
      res.status(500).json({
        error: {
          code: 'LOGOUT_ERROR',
          message: 'Error logging out',
        },
      })
    }
  }

  async getMe(req: Request, res: Response) {
    try {
      if (!req.user) {
        return res.status(401).json({
          error: {
            code: 'UNAUTHORIZED',
            message: 'Not authenticated',
          },
        })
      }

      const user = await AuthService.getMe(req.user.userId)

      res.json({
        data: user,
      })
    } catch (error) {
      console.error('Get me error:', error)
      res.status(500).json({
        error: {
          code: 'GET_USER_ERROR',
          message: 'Error fetching user data',
        },
      })
    }
  }
}

export default new AuthController()

