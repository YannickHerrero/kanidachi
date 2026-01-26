import * as React from "react"
import { Alert, Platform } from "react-native"
import { useRouter } from "expo-router"
import { deleteDatabaseAsync } from "expo-sqlite"

import { LogOut } from "@/lib/icons"
import ListItem from "@/components/ui/list-item"
import { useAuthStore } from "@/stores/auth"
import { useSettingsStore } from "@/stores/settings"
import { clearAudioCache } from "@/lib/audio/cache"
import { storage } from "@/lib/storage"

export const LogoutItem = () => {
  const router = useRouter()
  const logout = useAuthStore((s) => s.logout)
  const resetSettings = useSettingsStore((s) => s.resetSettings)

  const handleLogout = () => {
    Alert.alert(
      "Sign Out",
      "This will sign you out and delete all local data including synced subjects, assignments, and cached audio. You will need to sync again when you sign back in.",
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
              // Clear audio cache
              await clearAudioCache()

              // Clear MMKV storage
              storage.clearAll()

              // Reset settings to defaults
              resetSettings()

              // Delete the database
              if (Platform.OS !== "web") {
                try {
                  await deleteDatabaseAsync("database.db")
                } catch (error) {
                  // Database might not exist or already deleted
                  console.warn("Failed to delete database:", error)
                }
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
    <ListItem
      itemLeft={(props) => <LogOut {...props} />}
      label="Sign Out"
      variant="destructive"
      onPress={handleLogout}
      detail={false}
    />
  )
}
