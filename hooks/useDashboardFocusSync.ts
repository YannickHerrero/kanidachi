import * as React from "react"
import { useFocusEffect } from "@react-navigation/native"
import { Platform } from "react-native"
import { useDatabase } from "@/db/provider"
import { useAuthStore } from "@/stores/auth"
import { triggerQuickSync } from "@/lib/sync/background-sync"

/**
 * Hook that triggers a quick sync when the dashboard gains focus.
 * 
 * Following Tsurukame's viewDidAppear pattern:
 * - Syncs when navigating to the dashboard
 * - Syncs when returning to the dashboard from another screen
 * - Includes 30-second debounce to prevent rapid syncs from quick navigation
 */
export function useDashboardFocusSync() {
  const { db } = useDatabase()
  const status = useAuthStore((s) => s.status)
  const lastSyncRef = React.useRef<number>(0)

  useFocusEffect(
    React.useCallback(() => {
      // Don't run on web (focus behavior is different)
      if (Platform.OS === "web") return
      // Don't run if not authenticated or no database
      if (!db || status !== "authenticated") return

      const now = Date.now()
      const timeSinceLastSync = now - lastSyncRef.current

      // Debounce: only sync if it's been at least 30 seconds since last sync
      // This prevents rapid syncs when quickly navigating between screens
      if (timeSinceLastSync > 30000) {
        console.log("[DashboardFocusSync] Dashboard focused, triggering quick sync...")
        lastSyncRef.current = now
        triggerQuickSync()
      } else {
        console.log("[DashboardFocusSync] Sync throttled, skipping")
      }
    }, [db, status])
  )
}
