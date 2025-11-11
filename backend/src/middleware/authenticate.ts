import { Request, Response, NextFunction } from 'express'
import { verifyAccessToken, JWTPayload } from '../config/jwt'

// Extend Express Request to include user
declare global {
  namespace Express {
    interface Request {
      user?: JWTPayload
    }
  }
}

export const authenticate = (req: Request, res: Response, next: NextFunction) => {
  try {
    // Check for token in Authorization header or cookie
    const authHeader = req.headers.authorization
    const token = authHeader?.startsWith('Bearer ')
      ? authHeader.substring(7)
      : req.cookies?.accessToken

    if (!token) {
      return res.status(401).json({
        error: {
          code: 'UNAUTHORIZED',
          message: 'No authentication token provided',
        },
      })
    }

    // Verify token
    const payload = verifyAccessToken(token)
    req.user = payload
    next()
  } catch (error: any) {
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({
        error: {
          code: 'INVALID_TOKEN',
          message: 'Invalid authentication token',
        },
      })
    }
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({
        error: {
          code: 'TOKEN_EXPIRED',
          message: 'Authentication token has expired',
        },
      })
    }
    return res.status(500).json({
      error: {
        code: 'AUTHENTICATION_ERROR',
        message: 'Error verifying authentication',
      },
    })
  }
}

// Optional authentication - doesn't fail if no token
export const optionalAuth = (req: Request, res: Response, next: NextFunction) => {
  try {
    const authHeader = req.headers.authorization
    const token = authHeader?.startsWith('Bearer ')
      ? authHeader.substring(7)
      : req.cookies?.accessToken

    if (token) {
      const payload = verifyAccessToken(token)
      req.user = payload
    }
    next()
  } catch (error) {
    // Ignore errors for optional auth
    next()
  }
}

