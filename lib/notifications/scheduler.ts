import * as Notifications from "expo-notifications"
import { Platform } from "react-native"

// Notification identifiers
const REVIEW_REMINDER_ID = "review-reminder"

/**
 * Schedule a notification for upcoming reviews.
 * 
 * @param reviewCount - Number of reviews available
 * @param scheduledTime - When to show the notification (Date object)
 */
export async function scheduleReviewNotification(
  reviewCount: number,
  scheduledTime: Date
): Promise<string | null> {
  try {
    // Cancel any existing review reminder
    await cancelReviewNotifications()

    // Don't schedule if the time is in the past
    if (scheduledTime.getTime() <= Date.now()) {
      console.log("[notifications] Scheduled time is in the past, skipping")
      return null
    }

    const identifier = await Notifications.scheduleNotificationAsync({
      content: {
        title: "Reviews Available",
        body: reviewCount === 1
          ? "You have 1 review waiting"
          : `You have ${reviewCount} reviews waiting`,
        sound: true,
        badge: reviewCount,
        data: { type: "review-reminder", reviewCount },
      },
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.DATE,
        date: scheduledTime,
        channelId: Platform.OS === "android" ? "reviews" : undefined,
      },
      identifier: REVIEW_REMINDER_ID,
    })

    console.log(`[notifications] Scheduled review reminder for ${scheduledTime.toISOString()}`)
    return identifier
  } catch (error) {
    console.error("[notifications] Failed to schedule review notification:", error)
    return null
  }
}

/**
 * Schedule a daily review reminder at a specific time.
 * 
 * @param hour - Hour of day (0-23)
 * @param minute - Minute of hour (0-59)
 */
export async function scheduleDailyReviewReminder(
  hour: number,
  minute: number
): Promise<string | null> {
  try {
    // Cancel any existing daily reminder
    await cancelReviewNotifications()

    const identifier = await Notifications.scheduleNotificationAsync({
      content: {
        title: "Time to Review",
        body: "Check your WaniKani reviews!",
        sound: true,
        data: { type: "daily-reminder" },
      },
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.DAILY,
        hour,
        minute,
        channelId: Platform.OS === "android" ? "reviews" : undefined,
      },
      identifier: `${REVIEW_REMINDER_ID}-daily`,
    })

    console.log(`[notifications] Scheduled daily reminder for ${hour}:${minute.toString().padStart(2, "0")}`)
    return identifier
  } catch (error) {
    console.error("[notifications] Failed to schedule daily reminder:", error)
    return null
  }
}

/**
 * Cancel all scheduled review notifications.
 */
export async function cancelReviewNotifications(): Promise<void> {
  try {
    const scheduled = await Notifications.getAllScheduledNotificationsAsync()

    for (const notification of scheduled) {
      if (notification.identifier.startsWith(REVIEW_REMINDER_ID)) {
        await Notifications.cancelScheduledNotificationAsync(notification.identifier)
      }
    }

    console.log("[notifications] Cancelled all review notifications")
  } catch (error) {
    console.error("[notifications] Failed to cancel notifications:", error)
  }
}

/**
 * Get all currently scheduled notifications.
 */
export async function getScheduledNotifications(): Promise<Notifications.NotificationRequest[]> {
  return Notifications.getAllScheduledNotificationsAsync()
}

/**
 * Update the app badge count (iOS/Android).
 * 
 * @param count - The badge count to display
 */
export async function setBadgeCount(count: number): Promise<void> {
  try {
    await Notifications.setBadgeCountAsync(count)
  } catch (error) {
    console.error("[notifications] Failed to set badge count:", error)
  }
}

/**
 * Clear the app badge count.
 */
export async function clearBadgeCount(): Promise<void> {
  await setBadgeCount(0)
}

/**
 * Parse a time string (HH:mm) into hour and minute numbers.
 */
export function parseTimeString(timeString: string): { hour: number; minute: number } {
  const [hourStr, minuteStr] = timeString.split(":")
  return {
    hour: Number.parseInt(hourStr, 10) || 0,
    minute: Number.parseInt(minuteStr, 10) || 0,
  }
}

/**
 * Format hour and minute to a time string (HH:mm).
 */
export function formatTimeString(hour: number, minute: number): string {
  return `${hour.toString().padStart(2, "0")}:${minute.toString().padStart(2, "0")}`
}
