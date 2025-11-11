import api from './api'

export interface User {
  id: string
  email: string
  firstName: string | null
  lastName: string | null
  role: string
}

export interface RegisterData {
  email: string
  password: string
  firstName: string
  lastName: string
  role?: 'attorney' | 'paralegal' | 'viewer'
}

export interface LoginData {
  email: string
  password: string
}

export interface AuthResponse {
  user: User
  accessToken: string
}

class AuthService {
  async register(data: RegisterData): Promise<AuthResponse> {
    const response = await api.post('/auth/register', data)
    localStorage.setItem('accessToken', response.data.data.accessToken)
    return response.data.data
  }

  async login(data: LoginData): Promise<AuthResponse> {
    const response = await api.post('/auth/login', data)
    localStorage.setItem('accessToken', response.data.data.accessToken)
    return response.data.data
  }

  async logout(): Promise<void> {
    await api.post('/auth/logout')
    localStorage.removeItem('accessToken')
  }

  async getMe(): Promise<User> {
    const response = await api.get('/auth/me')
    return response.data.data
  }

  async refresh(): Promise<AuthResponse> {
    const response = await api.post('/auth/refresh')
    localStorage.setItem('accessToken', response.data.data.accessToken)
    return response.data.data
  }

  isAuthenticated(): boolean {
    return !!localStorage.getItem('accessToken')
  }
}

export default new AuthService()

