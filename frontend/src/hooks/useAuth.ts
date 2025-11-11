import { create } from 'zustand'
import authService, { User } from '../services/authService'

interface AuthState {
  user: User | null
  isLoading: boolean
  error: string | null
  isAuthenticated: boolean
  login: (email: string, password: string) => Promise<void>
  register: (data: any) => Promise<void>
  logout: () => Promise<void>
  fetchUser: () => Promise<void>
  clearError: () => void
}

export const useAuth = create<AuthState>((set) => ({
  user: null,
  isLoading: false,
  error: null,
  isAuthenticated: authService.isAuthenticated(),

  login: async (email: string, password: string) => {
    set({ isLoading: true, error: null })
    try {
      const response = await authService.login({ email, password })
      set({ user: response.user, isAuthenticated: true, isLoading: false })
    } catch (error: any) {
      const message = error.response?.data?.error?.message || 'Login failed'
      set({ error: message, isLoading: false })
      throw error
    }
  },

  register: async (data) => {
    set({ isLoading: true, error: null })
    try {
      const response = await authService.register(data)
      set({ user: response.user, isAuthenticated: true, isLoading: false })
    } catch (error: any) {
      const message = error.response?.data?.error?.message || 'Registration failed'
      set({ error: message, isLoading: false })
      throw error
    }
  },

  logout: async () => {
    set({ isLoading: true })
    try {
      await authService.logout()
      set({ user: null, isAuthenticated: false, isLoading: false })
    } catch (error) {
      set({ isLoading: false })
    }
  },

  fetchUser: async () => {
    if (!authService.isAuthenticated()) {
      set({ user: null, isAuthenticated: false })
      return
    }

    set({ isLoading: true })
    try {
      const user = await authService.getMe()
      set({ user, isAuthenticated: true, isLoading: false })
    } catch (error) {
      set({ user: null, isAuthenticated: false, isLoading: false })
    }
  },

  clearError: () => set({ error: null }),
}))

