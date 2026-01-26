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
  /** Whether the session expired (for showing appropriate message) */
  sessionExpired: boolean

  /** Initialize auth state from secure storage */
  initialize: () => Promise<void>
  /** Login with API token */
  login: (token: string) => Promise<boolean>
  /** Logout and clear token */
  logout: () => Promise<void>
  /** Force logout due to token expiration */
  forceLogout: (reason?: string) => Promise<void>
  /** Update user data (e.g., after sync) */
  setUser: (user: WKUser) => void
  /** Clear any error */
  clearError: () => void
  /** Clear session expired flag */
  clearSessionExpired: () => void
}

export const useAuthStore = create<AuthState>((set, get) => ({
  status: "loading",
  user: null,
  error: null,
  isLoggingIn: false,
  sessionExpired: false,

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
      sessionExpired: false,
    })
  },

  forceLogout: async (reason?: string) => {
    console.log("[auth] Force logout:", reason ?? "Token expired")
    try {
      await clearToken()
    } catch (error) {
      console.error("[auth] Error during force logout:", error)
    }

    set({
      status: "unauthenticated",
      user: null,
      error: reason ?? "Your session has expired. Please log in again.",
      sessionExpired: true,
    })
  },

  setUser: (user: WKUser) => {
    set({ user })
  },

  clearError: () => {
    set({ error: null })
  },

  clearSessionExpired: () => {
    set({ sessionExpired: false })
  },
}))
