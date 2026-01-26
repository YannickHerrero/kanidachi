import * as Notifications from "expo-notifications"
import * as Device from "expo-device"
import { Platform } from "react-native"

/**
 * Request notification permissions from the user.
 * Returns true if granted, false otherwise.
 */
export async function requestNotificationPermissions(): Promise<boolean> {
  // Notifications are only available on physical devices
  if (!Device.isDevice) {
    console.log("[notifications] Must use physical device for notifications")
    return false
  }

  // Check current permission status
  const { status: existingStatus } = await Notifications.getPermissionsAsync()

  if (existingStatus === "granted") {
    return true
  }

  // Request permissions
  const { status } = await Notifications.requestPermissionsAsync()

  return status === "granted"
}

/**
 * Get the current notification permission status.
 */
export async function getNotificationPermissionStatus(): Promise<Notifications.PermissionStatus> {
  const { status } = await Notifications.getPermissionsAsync()
  return status
}

/**
 * Check if notifications are currently granted.
 */
export async function areNotificationsEnabled(): Promise<boolean> {
  const status = await getNotificationPermissionStatus()
  return status === "granted"
}

/**
 * Configure notification handler for how notifications are displayed.
 * Called on app initialization.
 */
export function configureNotificationHandler(): void {
  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowBanner: true,
      shouldShowList: true,
      shouldPlaySound: true,
      shouldSetBadge: true,
    }),
  })
}

/**
 * Configure Android notification channel (required for Android).
 * Called on app initialization.
 */
export async function configureAndroidNotificationChannel(): Promise<void> {
  if (Platform.OS !== "android") return

  await Notifications.setNotificationChannelAsync("reviews", {
    name: "Review Reminders",
    importance: Notifications.AndroidImportance.HIGH,
    vibrationPattern: [0, 250, 250, 250],
    lightColor: "#ff00aa",
    description: "Notifications for upcoming WaniKani reviews",
    sound: "default",
    enableVibrate: true,
    showBadge: true,
  })
}
