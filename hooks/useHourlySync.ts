import * as React from "react"
import { AppState, AppStateStatus, Platform } from "react-native"
import { useDatabase } from "@/db/provider"
import { useAuthStore } from "@/stores/auth"
import { triggerQuickSync } from "@/lib/sync/background-sync"

/**
 * Hook that triggers a quick sync at the top of each hour.
 * 
 * Following Tsurukame's hourly timer pattern:
 * - Calculates time until next hour boundary
 * - Sets a timer that fires exactly at the top of the hour
 * - Triggers quick sync when timer fires (to update review availability)
 * - Cancels timer when app goes to background
 * - Recreates timer when app returns to foreground
 * 
 * This is important because reviews become available on the hour,
 * so we need to refresh the dashboard to show accurate counts.
 */
export function useHourlySync() {
  const { db } = useDatabase()
  const status = useAuthStore((s) => s.status)
  const timerRef = React.useRef<ReturnType<typeof setTimeout> | null>(null)

  const scheduleHourlySync = React.useCallback(() => {
    // Clear any existing timer
    if (timerRef.current) {
      clearTimeout(timerRef.current)
      timerRef.current = null
    }

    // Calculate milliseconds until next hour
    const now = new Date()
    const nextHour = new Date(now)
    nextHour.setHours(nextHour.getHours() + 1, 0, 0, 0)
    const msUntilNextHour = nextHour.getTime() - now.getTime()

    console.log(
      `[HourlySync] Scheduling sync for ${nextHour.toLocaleTimeString()} (in ${Math.round(msUntilNextHour / 1000 / 60)} minutes)`
    )

    timerRef.current = setTimeout(() => {
      console.log("[HourlySync] Hour changed, triggering sync...")
      triggerQuickSync()
      // Schedule the next hourly sync
      scheduleHourlySync()
    }, msUntilNextHour)
  }, [])

  const cancelTimer = React.useCallback(() => {
    if (timerRef.current) {
      clearTimeout(timerRef.current)
      timerRef.current = null
    }
  }, [])

  React.useEffect(() => {
    // Don't run on web
    if (Platform.OS === "web") return
    // Don't run if not authenticated or no database
    if (!db || status !== "authenticated") return

    // Start the hourly timer
    scheduleHourlySync()

    // Handle app state changes
    const handleAppStateChange = (nextState: AppStateStatus) => {
      if (nextState === "active") {
        // App came to foreground - reschedule timer
        // (The time until next hour may have changed while in background)
        scheduleHourlySync()
      } else if (nextState === "background" || nextState === "inactive") {
        // App went to background - cancel timer to save battery
        cancelTimer()
      }
    }

    const subscription = AppState.addEventListener("change", handleAppStateChange)

    return () => {
      cancelTimer()
      subscription.remove()
    }
  }, [db, status, scheduleHourlySync, cancelTimer])
}
