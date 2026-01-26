import { create } from "zustand"
import type { WKUser } from "@/lib/wanikani/types"
import {
  initializeAuth,
  setToken,
  clearToken,
  validateToken,
} from "@/lib/auth"

export type AuthStatus = "loading" | "authenticated" | "unauthenticated"

interface AuthState {
  /** Current authentication status */
  status: AuthStatus
  /** User data from WaniKani (null if not authenticated) */
  user: WKUser | null
  /** Error message if login failed */
  error: string | null
  /** Whether a login attempt is in progress */
  isLoggingIn: boolean

  /** Initialize auth state from secure storage */
  initialize: () => Promise<void>
  /** Login with API token */
  login: (token: string) => Promise<boolean>
  /** Logout and clear token */
  logout: () => Promise<void>
  /** Update user data (e.g., after sync) */
  setUser: (user: WKUser) => void
  /** Clear any error */
  clearError: () => void
}

export const useAuthStore = create<AuthState>((set, get) => ({
  status: "loading",
  user: null,
  error: null,
  isLoggingIn: false,

  initialize: async () => {
    try {
      const token = await initializeAuth()

      if (token) {
        // We have a stored token, but we don't fetch user data here
        // The sync process will do that and update the user
        set({ status: "authenticated", error: null })
      } else {
        set({ status: "unauthenticated", error: null })
      }
    } catch (error) {
      console.error("[auth] Error initializing auth:", error)
      set({ status: "unauthenticated", error: null })
    }
  },

  login: async (token: string) => {
    set({ isLoggingIn: true, error: null })

    try {
      // Validate the token and get user data
      const userResponse = await validateToken(token)

      // Store the token securely
      await setToken(token)

      // Update state with user data
      set({
        status: "authenticated",
        user: userResponse,
        isLoggingIn: false,
        error: null,
      })

      return true
    } catch (error) {
      const message = error instanceof Error ? error.message : "Login failed"
      console.error("[auth] Login error:", error)

      set({
        status: "unauthenticated",
        user: null,
        isLoggingIn: false,
        error: message,
      })

      return false
    }
  },

  logout: async () => {
    try {
      await clearToken()
    } catch (error) {
      console.error("[auth] Error during logout:", error)
    }

    set({
      status: "unauthenticated",
      user: null,
      error: null,
    })
  },

  setUser: (user: WKUser) => {
    set({ user })
  },

  clearError: () => {
    set({ error: null })
  },
}))
