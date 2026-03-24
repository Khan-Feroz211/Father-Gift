import { create } from 'zustand'
import api from '../lib/api'

interface User {
  id: string
  email: string
  full_name: string
  bar_number?: string | null
  court_name?: string | null
  phone?: string | null
  is_active: boolean
}

interface AuthState {
  user: User | null
  accessToken: string | null
  refreshToken: string | null
  login: (email: string, password: string) => Promise<void>
  logout: () => void
  setTokens: (access: string, refresh: string) => void
  hydrate: () => void
}

const REFRESH_KEY = 'legalpk_refresh_token'

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  accessToken: null,
  refreshToken: localStorage.getItem(REFRESH_KEY),

  setTokens: (access, refresh) => {
    localStorage.setItem(REFRESH_KEY, refresh)
    set({ accessToken: access, refreshToken: refresh })
  },

  login: async (email, password) => {
    const resp = await api.post('/auth/login', { email, password })
    const { access_token, refresh_token } = resp.data
    localStorage.setItem(REFRESH_KEY, refresh_token)
    set({ accessToken: access_token, refreshToken: refresh_token })
    // Fetch user profile
    const meResp = await api.get('/auth/me')
    set({ user: meResp.data })
  },

  logout: () => {
    // Fire-and-forget logout request
    const token = get().accessToken
    if (token) {
      api.post('/auth/logout').catch(() => undefined)
    }
    localStorage.removeItem(REFRESH_KEY)
    set({ user: null, accessToken: null, refreshToken: null })
    window.location.href = '/login'
  },

  hydrate: async () => {
    const refresh = localStorage.getItem(REFRESH_KEY)
    if (!refresh) return
    try {
      const resp = await api.post('/auth/refresh', { refresh_token: refresh })
      const { access_token, refresh_token: new_refresh } = resp.data
      localStorage.setItem(REFRESH_KEY, new_refresh)
      set({ accessToken: access_token, refreshToken: new_refresh })
      const meResp = await api.get('/auth/me')
      set({ user: meResp.data })
    } catch {
      localStorage.removeItem(REFRESH_KEY)
      set({ user: null, accessToken: null, refreshToken: null })
    }
  },
}))
