import { useEffect, useCallback } from "react"
import { AppState, type AppStateStatus, Platform } from "react-native"
import { useDatabase } from "@/db/provider"
import { getAvailableReviewCount, getReviewForecast } from "@/db/queries"
import { useSettingsStore } from "@/stores/settings"
import {
  scheduleReviewNotification,
  setBadgeCount,
  areNotificationsEnabled,
} from "@/lib/notifications"

/**
 * Hook to manage review notifications.
 * - Updates badge count when reviews are available
 * - Schedules notifications for upcoming reviews
 */
export function useReviewNotifications() {
  const { db } = useDatabase()
  const notificationsEnabled = useSettingsStore((s) => s.notificationsEnabled)

  const updateBadgeAndNotifications = useCallback(async () => {
    if (!db || Platform.OS === "web") return

    try {
      // Check if notifications are enabled (both in app and system)
      const systemEnabled = await areNotificationsEnabled()
      if (!notificationsEnabled || !systemEnabled) {
        await setBadgeCount(0)
        return
      }

      // Get current review count
      const reviewCount = await getAvailableReviewCount(db)

      // Update badge count
      await setBadgeCount(reviewCount)

      // Get forecast for next 24 hours
      const forecast = await getReviewForecast(db, 24)

      // Find the next hour with reviews
      if (forecast.length > 0) {
        // Find first hour with reviews that's in the future
        for (const { hour, count } of forecast) {
          if (hour > 0 && count > 0) {
            // Schedule a notification for when these reviews become available
            const now = new Date()
            const notificationTime = new Date(
              now.getTime() + hour * 60 * 60 * 1000
            )

            // Only schedule if it's at least 30 minutes away
            if (notificationTime.getTime() - now.getTime() > 30 * 60 * 1000) {
              await scheduleReviewNotification(
                reviewCount + count,
                notificationTime
              )
            }
            break
          }
        }
      }
    } catch (error) {
      console.error("[useReviewNotifications] Error updating notifications:", error)
    }
  }, [db, notificationsEnabled])

  // Update on mount and when app becomes active
  useEffect(() => {
    if (Platform.OS === "web") return

    updateBadgeAndNotifications()

    // Listen for app state changes
    const subscription = AppState.addEventListener(
      "change",
      (nextAppState: AppStateStatus) => {
        if (nextAppState === "active") {
          updateBadgeAndNotifications()
        }
      }
    )

    return () => {
      subscription.remove()
    }
  }, [updateBadgeAndNotifications])

  // Return the update function for manual refresh
  return { updateBadgeAndNotifications }
}
