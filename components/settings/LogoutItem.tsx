import * as React from "react"
import { Alert } from "react-native"
import { useRouter } from "expo-router"

import { LogOut } from "@/lib/icons"
import ListItem from "@/components/ui/list-item"
import { useAuthStore } from "@/stores/auth"
import { useSettingsStore } from "@/stores/settings"
import { clearAudioCache } from "@/lib/audio/cache"
import { storage } from "@/lib/storage"
import { useDatabase } from "@/db/provider"
import { stopBackgroundSync } from "@/lib/sync/background-sync"

export const LogoutItem = () => {
  const router = useRouter()
  const logout = useAuthStore((s) => s.logout)
  const resetSettings = useSettingsStore((s) => s.resetSettings)
  const resetDatabase = useDatabase().resetDatabase

  const handleSignOutOnly = () => {
    Alert.alert(
      "Sign Out",
      "You will be signed out, but your local flashcards and study data will stay on this device.",
      [
        {
          text: "Cancel",
          style: "cancel",
        },
        {
          text: "Sign Out",
          style: "destructive",
          onPress: async () => {
            try {
              stopBackgroundSync()
              await logout()
              router.replace("/login")
            } catch (error) {
              console.error("Failed to sign out:", error)
              Alert.alert("Error", "Failed to sign out. Please try again.")
            }
          },
        },
      ]
    )
  }

  const handleSignOutAndDelete = () => {
    Alert.alert(
      "Sign Out & Delete Local Data",
      "This will sign you out and delete local data including synced subjects, flashcards, progress, and cached audio.",
      [
        {
          text: "Cancel",
          style: "cancel",
        },
        {
          text: "Delete Data",
          style: "destructive",
          onPress: async () => {
            try {
              // Stop background sync to release database handles
              stopBackgroundSync()

              // Clear audio cache
              await clearAudioCache()

              // Clear MMKV storage
              storage.clearAll()

              // Reset settings to defaults
              resetSettings()

              // Clear all local database data (keep the database file)
              try {
                await resetDatabase()
              } catch (error) {
                console.warn("Failed to reset database:", error)
              }

               // Logout (clears token from secure storage)
               await logout()

              // Navigate to login
              router.replace("/login")
            } catch (error) {
              console.error("Failed to logout:", error)
              Alert.alert("Error", "Failed to sign out. Please try again.")
            }
          },
        },
      ]
    )
  }

  return (
    <>
      <ListItem
        itemLeft={(props) => <LogOut {...props} />}
        label="Sign Out"
        onPress={handleSignOutOnly}
        detail={false}
      />
      <ListItem
        itemLeft={(props) => <LogOut {...props} />}
        label="Sign Out & Delete Local Data"
        variant="destructive"
        onPress={handleSignOutAndDelete}
        detail={false}
      />
    </>
  )
}
