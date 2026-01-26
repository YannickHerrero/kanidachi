import * as React from "react"
import { useEffect, useState, useCallback } from "react"
import { Alert, Linking, Platform, Pressable, View } from "react-native"
import * as Notifications from "expo-notifications"
import * as IntentLauncher from "expo-intent-launcher"
import DateTimePicker from "@react-native-community/datetimepicker"

import { H4 } from "@/components/ui/typography"
import {
  BottomSheet,
  BottomSheetContent,
  BottomSheetHeader,
  BottomSheetOpenTrigger,
  BottomSheetView,
} from "@/components/primitives/bottomSheet/bottom-sheet.native"
import { Text } from "@/components/ui/text"
import { Bell } from "@/lib/icons"
import ListItem from "@/components/ui/list-item"
import { Switch } from "@/components/ui/switch"
import { Separator } from "@/components/ui/separator"
import { useBottomSheetModal } from "@gorhom/bottom-sheet"

import { useSettingsStore } from "@/stores/settings"
import {
  requestNotificationPermissions,
  getNotificationPermissionStatus,
  scheduleDailyReviewReminder,
  cancelReviewNotifications,
  parseTimeString,
  formatTimeString,
  configureAndroidNotificationChannel,
} from "@/lib/notifications"

export const NotificationItem = () => {
  const [permissionStatus, setPermissionStatus] =
    useState<Notifications.PermissionStatus | null>(null)
  const [showTimePicker, setShowTimePicker] = useState(false)

  const {
    notificationsEnabled,
    notificationTime,
    setNotificationsEnabled,
    setNotificationTime,
  } = useSettingsStore()

  const { dismiss } = useBottomSheetModal()

  // Check permission status on mount
  useEffect(() => {
    checkPermissionStatus()
  }, [])

  const checkPermissionStatus = async () => {
    const status = await getNotificationPermissionStatus()
    setPermissionStatus(status)
  }

  const handleEnableNotifications = async (enabled: boolean) => {
    if (enabled) {
      // Request permissions first
      const granted = await requestNotificationPermissions()

      if (!granted) {
        Alert.alert(
          "Permission Required",
          "Please enable notifications in your device settings to receive review reminders.",
          [
            { text: "Cancel", style: "cancel" },
            {
              text: "Open Settings",
              onPress: openSettings,
            },
          ]
        )
        return
      }

      // Configure Android channel
      await configureAndroidNotificationChannel()

      // Schedule daily reminder
      const { hour, minute } = parseTimeString(notificationTime)
      await scheduleDailyReviewReminder(hour, minute)

      setNotificationsEnabled(true)
      await checkPermissionStatus()
    } else {
      // Cancel all notifications
      await cancelReviewNotifications()
      setNotificationsEnabled(false)
    }
  }

  const handleTimeChange = async (event: any, selectedDate?: Date) => {
    setShowTimePicker(Platform.OS === "ios")

    if (selectedDate && event.type !== "dismissed") {
      const hour = selectedDate.getHours()
      const minute = selectedDate.getMinutes()
      const timeString = formatTimeString(hour, minute)

      setNotificationTime(timeString)

      // Reschedule notification if enabled
      if (notificationsEnabled) {
        await scheduleDailyReviewReminder(hour, minute)
      }
    }
  }

  const openSettings = async () => {
    if (Platform.OS === "ios") {
      await Linking.openSettings()
    } else {
      await IntentLauncher.startActivityAsync(
        IntentLauncher.ActivityAction.APPLICATION_DETAILS_SETTINGS,
        { data: "package:com.kanidachi.app" }
      )
    }
  }

  // Parse current time for picker
  const { hour, minute } = parseTimeString(notificationTime)
  const pickerDate = new Date()
  pickerDate.setHours(hour, minute, 0, 0)

  const isPermissionGranted =
    permissionStatus === Notifications.PermissionStatus.GRANTED
  const isPermissionDenied =
    permissionStatus === Notifications.PermissionStatus.DENIED

  // Format time for display
  const displayTime = new Date()
  displayTime.setHours(hour, minute)
  const formattedTime = displayTime.toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
  })

  return (
    <BottomSheet>
      <BottomSheetOpenTrigger asChild>
        <ListItem
          itemLeft={(props) => <Bell {...props} />}
          label="Notifications"
          itemRight={() => (
            <Text className="text-muted-foreground">
              {notificationsEnabled && isPermissionGranted ? "On" : "Off"}
            </Text>
          )}
        />
      </BottomSheetOpenTrigger>
      <BottomSheetContent>
        <BottomSheetHeader className="bg-background">
          <Text className="text-foreground text-xl font-bold pb-1">
            Notification Settings
          </Text>
        </BottomSheetHeader>
        <BottomSheetView className="gap-4 pt-6 bg-background">
          {/* Permission warning */}
          {isPermissionDenied && (
            <View className="bg-destructive/10 p-3 rounded-lg mb-2">
              <Text className="text-sm text-destructive">
                Notifications are blocked. Please enable them in your device
                settings.
              </Text>
              <Pressable onPress={openSettings} className="mt-2">
                <Text className="text-sm text-primary font-medium">
                  Open Settings
                </Text>
              </Pressable>
            </View>
          )}

          {/* Enable notifications toggle */}
          <Pressable
            className="flex-row items-center justify-between py-2"
            onPress={() => handleEnableNotifications(!notificationsEnabled)}
          >
            <View className="flex-1 pr-4">
              <H4>Daily Reminder</H4>
              <Text className="text-sm text-muted-foreground">
                Get a daily notification to remind you to do your reviews
              </Text>
            </View>
            <Switch
              checked={notificationsEnabled && isPermissionGranted}
              onCheckedChange={handleEnableNotifications}
              disabled={isPermissionDenied}
            />
          </Pressable>

          {/* Time picker */}
          {notificationsEnabled && isPermissionGranted && (
            <>
              <Separator />
              <Pressable
                className="flex-row items-center justify-between py-2"
                onPress={() => setShowTimePicker(true)}
              >
                <View className="flex-1 pr-4">
                  <H4>Reminder Time</H4>
                  <Text className="text-sm text-muted-foreground">
                    When to receive your daily reminder
                  </Text>
                </View>
                <Text className="text-primary font-medium">{formattedTime}</Text>
              </Pressable>

              {showTimePicker && (
                <DateTimePicker
                  value={pickerDate}
                  mode="time"
                  is24Hour={true}
                  display={Platform.OS === "ios" ? "spinner" : "default"}
                  onChange={handleTimeChange}
                />
              )}
            </>
          )}

          <View className="pt-4">
            <Text className="text-xs text-muted-foreground text-center">
              You'll also receive notifications when you have reviews ready
              throughout the day.
            </Text>
          </View>
        </BottomSheetView>
      </BottomSheetContent>
    </BottomSheet>
  )
}
