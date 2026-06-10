import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export const useAuthStore = create(
  persist(
    (set) => ({
      user:  null,
      token: null,
      refreshToken: null,
      login: (user, token, refreshToken) => set({ user, token, refreshToken }),
      logout: () => set({ user: null, token: null, refreshToken: null }),
      updateUser: (updates) => set((s) => ({ user: { ...s.user, ...updates } })),
    }),
    { name: 'medpredict-auth' }
  )
)
