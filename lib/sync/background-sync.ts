import type { ExpoSQLiteDatabase } from "drizzle-orm/expo-sqlite"
import type { SQLJsDatabase } from "drizzle-orm/sql-js"

import { processQueue, getPendingCount } from "./pending-queue"
import { performQuickSync } from "./incremental-sync"
import { checkIsOnline } from "@/hooks/useNetworkStatus"
import { getToken } from "@/lib/auth"
import { wanikaniClient } from "@/lib/wanikani/client"
import { WaniKaniError } from "@/lib/wanikani/errors"
import { useAuthStore } from "@/stores/auth"
import { logError } from "@/db/queries"

type Database = SQLJsDatabase | ExpoSQLiteDatabase | null

/**
 * Background sync manager
 * Processes pending queue items when online and syncs latest data
 */
class BackgroundSyncManager {
  private isRunning = false
  private intervalId: NodeJS.Timeout | null = null
  private db: Database = null
  private lastQuickSyncAt = 0

  /**
   * Initialize the background sync manager
   */
  async initialize(db: Database): Promise<void> {
    this.db = db

    // Ensure API client has token
    const token = await getToken()
    if (token) {
      wanikaniClient.setToken(token)
    }

    // Start periodic sync
    this.startPeriodicSync()

    // Do an immediate sync attempt
    this.syncNow()
  }

  /**
   * Start periodic background sync (every 30 seconds)
   */
  startPeriodicSync(): void {
    if (this.intervalId) return

    this.intervalId = setInterval(() => {
      this.syncNow()
    }, 30000) // 30 seconds
  }

  /**
   * Stop periodic background sync
   */
  stopPeriodicSync(): void {
    if (this.intervalId) {
      clearInterval(this.intervalId)
      this.intervalId = null
    }
  }

  /**
   * Trigger an immediate sync attempt
   */
  async syncNow(): Promise<void> {
    if (this.isRunning || !this.db) return

    // Check if we have pending items
    const pendingCount = await getPendingCount(this.db)
    if (pendingCount === 0) return

    // Check if we're online
    const isOnline = await checkIsOnline()
    if (!isOnline) {
      console.log("[BackgroundSync] Offline, skipping sync")
      return
    }

    // Check if we have a token
    if (!wanikaniClient.isAuthenticated) {
      const token = await getToken()
      if (!token) {
        console.log("[BackgroundSync] No token, skipping sync")
        return
      }
      wanikaniClient.setToken(token)
    }

    this.isRunning = true

    try {
      console.log(`[BackgroundSync] Processing ${pendingCount} pending items...`)
      // Reserve 5 requests for quick sync after processing
      const result = await processQueue(this.db, 5)
      console.log(
        `[BackgroundSync] Processed: ${result.processed}, Failed: ${result.failed}, Remaining: ${result.remaining}`
      )

      // Handle auth errors by forcing logout
      if (result.authError) {
        console.log("[BackgroundSync] Auth error detected, forcing logout")
        useAuthStore.getState().forceLogout("Your session has expired. Please log in again.")
        this.stopPeriodicSync()
        return
      }

      // After successful queue processing, do a quick sync to get latest server state
      if (result.processed > 0) {
        try {
          console.log("[BackgroundSync] Queue processed, fetching latest assignments...")
          await performQuickSync(this.db!)
          this.lastQuickSyncAt = Date.now()
        } catch (syncError) {
          if (syncError instanceof WaniKaniError && syncError.isAuthError) {
            console.log("[BackgroundSync] Quick sync auth error, forcing logout")
            useAuthStore.getState().forceLogout("Your session has expired. Please log in again.")
            this.stopPeriodicSync()
          } else {
            console.error("[BackgroundSync] Quick sync failed:", syncError)
            // Don't throw - this is best-effort
          }
        }
      }
    } catch (error) {
      console.error("[BackgroundSync] Error during sync:", error)
      
      // Log error to database for debugging
      if (this.db) {
        await logError(
          this.db,
          "sync",
          error instanceof Error ? error.message : "Unknown sync error",
          {
            details: { stack: error instanceof Error ? error.stack : undefined },
          }
        ).catch(() => {}) // Ignore logging failures
      }
    } finally {
      this.isRunning = false
    }
  }

  /**
   * Trigger a quick sync to fetch latest assignments
   * Use this when app comes to foreground
   */
  async quickSync(): Promise<void> {
    if (this.isRunning || !this.db) return

    // Rate limit quick syncs to every 30 seconds
    const timeSinceLastSync = Date.now() - this.lastQuickSyncAt
    if (timeSinceLastSync < 30000) {
      console.log("[BackgroundSync] Quick sync throttled, skipping")
      return
    }

    // Check if we're online
    const isOnline = await checkIsOnline()
    if (!isOnline) {
      console.log("[BackgroundSync] Offline, skipping quick sync")
      return
    }

    // Check if we have a token
    if (!wanikaniClient.isAuthenticated) {
      const token = await getToken()
      if (!token) {
        console.log("[BackgroundSync] No token, skipping quick sync")
        return
      }
      wanikaniClient.setToken(token)
    }

    this.isRunning = true

    try {
      console.log("[BackgroundSync] Starting quick sync...")
      await performQuickSync(this.db)
      this.lastQuickSyncAt = Date.now()
    } catch (error) {
      if (error instanceof WaniKaniError && error.isAuthError) {
        console.log("[BackgroundSync] Quick sync auth error, forcing logout")
        useAuthStore.getState().forceLogout("Your session has expired. Please log in again.")
        this.stopPeriodicSync()
      } else {
        console.error("[BackgroundSync] Quick sync error:", error)
        
        // Log error to database for debugging
        if (this.db) {
          await logError(
            this.db,
            "sync",
            error instanceof Error ? error.message : "Quick sync failed",
            {
              code: error instanceof WaniKaniError ? error.code : undefined,
              details: { stack: error instanceof Error ? error.stack : undefined },
            }
          ).catch(() => {})
        }
      }
    } finally {
      this.isRunning = false
    }
  }

  /**
   * Clean up resources
   */
  destroy(): void {
    this.stopPeriodicSync()
    this.db = null
  }
}

// Export singleton instance
export const backgroundSyncManager = new BackgroundSyncManager()

/**
 * Initialize background sync with database
 * Call this when the app starts and database is ready
 */
export async function initializeBackgroundSync(db: Database): Promise<void> {
  await backgroundSyncManager.initialize(db)
}

/**
 * Trigger an immediate sync attempt
 * Call this when network becomes available or after completing reviews/lessons
 */
export async function triggerSync(): Promise<void> {
  await backgroundSyncManager.syncNow()
}

/**
 * Trigger a quick sync to fetch latest assignments
 * Call this when app comes to foreground
 */
export async function triggerQuickSync(): Promise<void> {
  await backgroundSyncManager.quickSync()
}

/**
 * Stop background sync
 * Call this when the app is closing or user logs out
 */
export function stopBackgroundSync(): void {
  backgroundSyncManager.destroy()
}
