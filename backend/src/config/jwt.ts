import jwt from 'jsonwebtoken'

export const JWT_SECRET = process.env.JWT_SECRET || 'dev-secret-change-in-production'
export const JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET || 'dev-refresh-secret'
export const JWT_ACCESS_EXPIRATION = process.env.JWT_ACCESS_EXPIRATION || '15m'
export const JWT_REFRESH_EXPIRATION = process.env.JWT_REFRESH_EXPIRATION || '7d'

export interface JWTPayload {
  userId: string
  email: string
  role: string
}

export const generateAccessToken = (payload: JWTPayload): string => {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_ACCESS_EXPIRATION })
}

export const generateRefreshToken = (payload: JWTPayload): string => {
  return jwt.sign(payload, JWT_REFRESH_SECRET, { expiresIn: JWT_REFRESH_EXPIRATION })
}

export const verifyAccessToken = (token: string): JWTPayload => {
  return jwt.verify(token, JWT_SECRET) as JWTPayload
}

export const verifyRefreshToken = (token: string): JWTPayload => {
  return jwt.verify(token, JWT_REFRESH_SECRET) as JWTPayload
}

