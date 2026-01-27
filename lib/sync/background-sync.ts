import type { ExpoSQLiteDatabase } from "drizzle-orm/expo-sqlite"
import type { SQLJsDatabase } from "drizzle-orm/sql-js"

import { processQueue, getPendingCount } from "./pending-queue"
import { performQuickSync, performFullRefreshSync } from "./incremental-sync"
import { checkIsOnline } from "@/hooks/useNetworkStatus"
import { getToken } from "@/lib/auth"
import { wanikaniClient } from "@/lib/wanikani/client"
import { WaniKaniError } from "@/lib/wanikani/errors"
import { useAuthStore } from "@/stores/auth"
import { useBackgroundSyncStore } from "@/stores/background-sync"
import { logError } from "@/db/queries"

type Database = SQLJsDatabase | ExpoSQLiteDatabase | null

/**
 * Background sync manager
 * Processes pending queue items when online and syncs latest data
 * 
 * Following Tsurukame's pattern, sync is triggered by:
 * - Dashboard focus (useDashboardFocusSync)
 * - App foreground (useAppStateSync)
 * - Hourly timer (useHourlySync)
 * - Pull-to-refresh (manual)
 * 
 * NOT by a periodic interval timer (too aggressive for battery/rate limits)
 */
class BackgroundSyncManager {
  private isRunning = false
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

    // Process any pending queue items on startup
    this.processPendingQueue()
  }

  /**
   * Update the store with current pending count
   */
  private async updatePendingCount(): Promise<number> {
    if (!this.db) return 0
    const count = await getPendingCount(this.db)
    useBackgroundSyncStore.getState().setPendingCount(count)
    return count
  }

  /**
   * Process pending queue items (lessons/reviews waiting to be sent)
   * Called when network becomes available or after reviews/lessons
   */
  async processPendingQueue(): Promise<void> {
    if (this.isRunning || !this.db) return

    // Check if we have pending items
    const pendingCount = await this.updatePendingCount()
    if (pendingCount === 0) return

    // Check if we're online
    const isOnline = await checkIsOnline()
    if (!isOnline) {
      console.log("[BackgroundSync] Offline, skipping queue processing")
      return
    }

    // Check if we have a token
    if (!wanikaniClient.isAuthenticated) {
      const token = await getToken()
      if (!token) {
        console.log("[BackgroundSync] No token, skipping queue processing")
        return
      }
      wanikaniClient.setToken(token)
    }

    this.isRunning = true
    const store = useBackgroundSyncStore.getState()
    store.startSync(false)

    try {
      console.log(`[BackgroundSync] Processing ${pendingCount} pending items...`)
      
      // Process queue with progress reporting
      const result = await processQueue(this.db, 5, (processed, total) => {
        const progress = total > 0 ? (processed / total) * 50 : 0 // First 50% for queue
        store.setProgress(progress)
      })
      
      console.log(
        `[BackgroundSync] Processed: ${result.processed}, Failed: ${result.failed}, Remaining: ${result.remaining}`
      )

      // Update pending count after processing
      await this.updatePendingCount()

      // Handle auth errors by forcing logout
      if (result.authError) {
        console.log("[BackgroundSync] Auth error detected, forcing logout")
        useAuthStore.getState().forceLogout("Your session has expired. Please log in again.")
        return
      }

      // After successful queue processing, do a quick sync to get latest server state
      if (result.processed > 0) {
        try {
          console.log("[BackgroundSync] Queue processed, fetching latest assignments...")
          store.setProgress(50)
          await performQuickSync(this.db!, (progress) => {
            store.setProgress(50 + progress * 0.5) // Last 50% for quick sync
          })
          this.lastQuickSyncAt = Date.now()
        } catch (syncError) {
          if (syncError instanceof WaniKaniError && syncError.isAuthError) {
            console.log("[BackgroundSync] Quick sync auth error, forcing logout")
            useAuthStore.getState().forceLogout("Your session has expired. Please log in again.")
          } else {
            console.error("[BackgroundSync] Quick sync failed:", syncError)
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
        ).catch(() => {})
      }
    } finally {
      this.isRunning = false
      store.completeSync()
      await this.updatePendingCount()
    }
  }

  /**
   * Trigger a quick sync to fetch latest assignments
   * Use this when:
   * - App comes to foreground
   * - Dashboard gains focus
   * - Hourly timer fires
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
    const store = useBackgroundSyncStore.getState()
    store.startSync(false)

    try {
      console.log("[BackgroundSync] Starting quick sync...")
      await performQuickSync(this.db, (progress) => {
        store.setProgress(progress)
      })
      this.lastQuickSyncAt = Date.now()
    } catch (error) {
      if (error instanceof WaniKaniError && error.isAuthError) {
        console.log("[BackgroundSync] Quick sync auth error, forcing logout")
        useAuthStore.getState().forceLogout("Your session has expired. Please log in again.")
      } else {
        console.error("[BackgroundSync] Quick sync error:", error)
        
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
      store.completeSync()
    }
  }

  /**
   * Trigger a full refresh sync
   * Use this for pull-to-refresh when user explicitly wants latest data
   * Shows fullscreen overlay
   */
  async fullRefreshSync(): Promise<void> {
    if (this.isRunning || !this.db) return

    // Check if we're online
    const isOnline = await checkIsOnline()
    if (!isOnline) {
      console.log("[BackgroundSync] Offline, skipping full refresh")
      return
    }

    // Check if we have a token
    if (!wanikaniClient.isAuthenticated) {
      const token = await getToken()
      if (!token) {
        console.log("[BackgroundSync] No token, skipping full refresh")
        return
      }
      wanikaniClient.setToken(token)
    }

    this.isRunning = true
    const store = useBackgroundSyncStore.getState()
    store.startSync(true) // isFullRefresh = true

    try {
      console.log("[BackgroundSync] Starting full refresh sync...")
      await performFullRefreshSync(this.db, (progress) => {
        store.setProgress(progress)
      })
      this.lastQuickSyncAt = Date.now()
    } catch (error) {
      if (error instanceof WaniKaniError && error.isAuthError) {
        console.log("[BackgroundSync] Full refresh auth error, forcing logout")
        useAuthStore.getState().forceLogout("Your session has expired. Please log in again.")
      } else {
        console.error("[BackgroundSync] Full refresh error:", error)
        
        if (this.db) {
          await logError(
            this.db,
            "sync",
            error instanceof Error ? error.message : "Full refresh failed",
            {
              code: error instanceof WaniKaniError ? error.code : undefined,
              details: { stack: error instanceof Error ? error.stack : undefined },
            }
          ).catch(() => {})
        }
      }
    } finally {
      this.isRunning = false
      store.completeSync()
    }
  }

  /**
   * Clean up resources
   */
  destroy(): void {
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
 * Process pending queue items
 * Call this when network becomes available or after completing reviews/lessons
 */
export async function triggerSync(): Promise<void> {
  await backgroundSyncManager.processPendingQueue()
}

/**
 * Trigger a quick sync to fetch latest assignments
 * Call this when app comes to foreground, dashboard gains focus, or hourly timer fires
 */
export async function triggerQuickSync(): Promise<void> {
  await backgroundSyncManager.quickSync()
}

/**
 * Trigger a full refresh sync
 * Call this for pull-to-refresh
 */
export async function triggerFullRefreshSync(): Promise<void> {
  await backgroundSyncManager.fullRefreshSync()
}

/**
 * Stop background sync
 * Call this when the app is closing or user logs out
 */
export function stopBackgroundSync(): void {
  backgroundSyncManager.destroy()
}
