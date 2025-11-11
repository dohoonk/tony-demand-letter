import bcrypt from 'bcryptjs'
import prisma from '../config/database'
import { generateAccessToken, generateRefreshToken, JWTPayload } from '../config/jwt'

export interface RegisterInput {
  email: string
  password: string
  firstName: string
  lastName: string
  role?: 'attorney' | 'paralegal' | 'viewer'
}

export interface LoginInput {
  email: string
  password: string
}

export interface AuthResponse {
  user: {
    id: string
    email: string
    firstName: string | null
    lastName: string | null
    role: string
  }
  accessToken: string
  refreshToken: string
}

class AuthService {
  async register(input: RegisterInput): Promise<AuthResponse> {
    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email: input.email },
    })

    if (existingUser) {
      throw new Error('User with this email already exists')
    }

    // Hash password
    const passwordHash = await bcrypt.hash(input.password, 10)

    // Create user
    const user = await prisma.user.create({
      data: {
        email: input.email,
        passwordHash,
        firstName: input.firstName,
        lastName: input.lastName,
        role: input.role || 'attorney',
      },
    })

    // Generate tokens
    const payload: JWTPayload = {
      userId: user.id,
      email: user.email,
      role: user.role,
    }

    const accessToken = generateAccessToken(payload)
    const refreshToken = generateRefreshToken(payload)

    return {
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role,
      },
      accessToken,
      refreshToken,
    }
  }

  async login(input: LoginInput): Promise<AuthResponse> {
    // Find user
    const user = await prisma.user.findUnique({
      where: { email: input.email },
    })

    if (!user) {
      throw new Error('Invalid email or password')
    }

    // Verify password
    const isValidPassword = await bcrypt.compare(input.password, user.passwordHash)

    if (!isValidPassword) {
      throw new Error('Invalid email or password')
    }

    // Generate tokens
    const payload: JWTPayload = {
      userId: user.id,
      email: user.email,
      role: user.role,
    }

    const accessToken = generateAccessToken(payload)
    const refreshToken = generateRefreshToken(payload)

    return {
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role,
      },
      accessToken,
      refreshToken,
    }
  }

  async refresh(refreshToken: string): Promise<AuthResponse> {
    // This will throw if token is invalid
    const { verifyRefreshToken } = await import('../config/jwt')
    const payload = verifyRefreshToken(refreshToken)

    // Get user from database
    const user = await prisma.user.findUnique({
      where: { id: payload.userId },
    })

    if (!user) {
      throw new Error('User not found')
    }

    // Generate new tokens
    const newPayload: JWTPayload = {
      userId: user.id,
      email: user.email,
      role: user.role,
    }

    const accessToken = generateAccessToken(newPayload)
    const newRefreshToken = generateRefreshToken(newPayload)

    return {
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role,
      },
      accessToken,
      refreshToken: newRefreshToken,
    }
  }

  async getMe(userId: string) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        role: true,
        createdAt: true,
        updatedAt: true,
      },
    })

    if (!user) {
      throw new Error('User not found')
    }

    return user
  }
}

export default new AuthService()

