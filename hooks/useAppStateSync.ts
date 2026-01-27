import * as React from "react"
import { AppState, AppStateStatus, Platform } from "react-native"
import { useDatabase } from "@/db/provider"
import { useAuthStore } from "@/stores/auth"
import { triggerQuickSync, triggerSync } from "@/lib/sync/background-sync"

/**
 * Hook that triggers sync when app comes to foreground
 * 
 * Following Tsurukame's pattern:
 * - On app foreground: process pending queue + quick sync
 * - Assumes the hour may have changed while in background (reviews become available on the hour)
 * - This catches reviews done on other devices while app was in background
 */
export function useAppStateSync() {
  const { db } = useDatabase()
  const status = useAuthStore((s) => s.status)
  const lastForegroundRef = React.useRef<number>(Date.now())

  React.useEffect(() => {
    // Don't run on web
    if (Platform.OS === "web") return
    // Don't run if not authenticated or no database
    if (!db || status !== "authenticated") return

    const handleAppStateChange = (nextState: AppStateStatus) => {
      if (nextState === "active") {
        const now = Date.now()
        const timeSinceLastForeground = now - lastForegroundRef.current

        // Only sync if it's been at least 30 seconds since last foreground
        // Prevents rapid syncs from app switching
        if (timeSinceLastForeground > 30000) {
          console.log("[AppStateSync] App foregrounded, triggering sync...")
          
          // Following Tsurukame's applicationWillEnterForeground pattern:
          // Assume the hour changed while the app was in the background.
          // This ensures we get fresh review availability data.
          
          // First process pending queue (reviews/lessons waiting to sync)
          triggerSync()
          
          // Then do a quick sync to get latest assignments
          // (triggerSync will do this after processing the queue,
          // but we also call it explicitly in case queue is empty)
          triggerQuickSync()
        }

        lastForegroundRef.current = now
      }
    }

    const subscription = AppState.addEventListener("change", handleAppStateChange)
    return () => subscription.remove()
  }, [db, status])
}
