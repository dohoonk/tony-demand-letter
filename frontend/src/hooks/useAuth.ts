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
      console.log('[useAuth] login: attempting', { email })
      const response = await authService.login({ email, password })
      console.log('[useAuth] login: success', { userId: response.user.id })
      set({ user: response.user, isAuthenticated: true, isLoading: false })
    } catch (error: any) {
      const message = error.response?.data?.error?.message || 'Login failed'
      console.error('[useAuth] login: failed', { email, message }, error)
      set({ error: message, isLoading: false })
      throw error
    }
  },

  register: async (data) => {
    set({ isLoading: true, error: null })
    try {
      console.log('[useAuth] register: attempting', { email: data.email })
      const response = await authService.register(data)
      console.log('[useAuth] register: success', { userId: response.user.id })
      set({ user: response.user, isAuthenticated: true, isLoading: false })
    } catch (error: any) {
      const message = error.response?.data?.error?.message || 'Registration failed'
      console.error('[useAuth] register: failed', { email: data.email, message }, error)
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
    console.log('[useAuth] fetchUser: invoked')
    if (!authService.isAuthenticated()) {
      console.log('[useAuth] fetchUser: no access token, skipping request')
      set({ user: null, isAuthenticated: false })
      return
    }

    set({ isLoading: true })
    try {
      console.log('[useAuth] fetchUser: requesting /auth/me')
      const user = await authService.getMe()
      console.log('[useAuth] fetchUser: success', { userId: user.id })
      set({ user, isAuthenticated: true, isLoading: false })
    } catch (error) {
      console.error('[useAuth] fetchUser: failed, clearing auth state', error)
      set({ user: null, isAuthenticated: false, isLoading: false })
    }
  },

  clearError: () => set({ error: null }),
}))

