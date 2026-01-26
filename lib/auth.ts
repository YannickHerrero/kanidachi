import * as SecureStore from "expo-secure-store"
import { Platform } from "react-native"
import { wanikaniClient } from "@/lib/wanikani/client"
import type { WKUser } from "@/lib/wanikani/types"

const TOKEN_KEY = "wanikani_api_token"

/**
 * Secure storage for API token
 * Uses expo-secure-store on native, localStorage on web (less secure but functional)
 */

/**
 * Get the stored API token
 */
export async function getToken(): Promise<string | null> {
  try {
    if (Platform.OS === "web") {
      return localStorage.getItem(TOKEN_KEY)
    }
    return await SecureStore.getItemAsync(TOKEN_KEY)
  } catch (error) {
    console.error("[auth] Error reading token:", error)
    return null
  }
}

/**
 * Store the API token securely
 */
export async function setToken(token: string): Promise<void> {
  try {
    if (Platform.OS === "web") {
      localStorage.setItem(TOKEN_KEY, token)
    } else {
      await SecureStore.setItemAsync(TOKEN_KEY, token)
    }
    // Also set the token on the client
    wanikaniClient.setToken(token)
  } catch (error) {
    console.error("[auth] Error storing token:", error)
    throw new Error("Failed to store API token")
  }
}

/**
 * Remove the stored API token
 */
export async function clearToken(): Promise<void> {
  try {
    if (Platform.OS === "web") {
      localStorage.removeItem(TOKEN_KEY)
    } else {
      await SecureStore.deleteItemAsync(TOKEN_KEY)
    }
    wanikaniClient.setToken(null)
  } catch (error) {
    console.error("[auth] Error clearing token:", error)
    throw new Error("Failed to clear API token")
  }
}

/**
 * Initialize the auth state on app launch
 * Loads the token from secure storage and sets it on the client
 * Returns the token if found, null otherwise
 */
export async function initializeAuth(): Promise<string | null> {
  const token = await getToken()
  if (token) {
    wanikaniClient.setToken(token)
  }
  return token
}

/**
 * Validate an API token by making a request to get the user profile
 * Returns the user data if valid, throws an error if invalid
 */
export async function validateToken(token: string): Promise<WKUser> {
  // Temporarily set the token to validate it
  wanikaniClient.setToken(token)

  try {
    const user = await wanikaniClient.getUser()
    return user
  } catch (error) {
    // Reset the token if validation failed
    wanikaniClient.setToken(null)
    throw error
  }
}

/**
 * Check if a token looks like a valid WaniKani API token
 * WaniKani tokens are 36-character UUIDs
 */
export function isValidTokenFormat(token: string): boolean {
  // UUID format: xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx (36 characters with hyphens)
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
  return uuidRegex.test(token.trim())
}
