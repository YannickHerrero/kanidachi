import * as React from "react"
import { useEffect, useState } from "react"
import { Alert, Platform, View } from "react-native"

import { Text } from "@/components/ui/text"
import { HardDrive } from "@/lib/icons"
import ListItem from "@/components/ui/list-item"
import { clearAudioCache, getAudioCacheSize, formatBytes } from "@/lib/audio/cache"

export const CacheSettingsItem = () => {
  const [cacheSize, setCacheSize] = useState<number>(0)
  const [isClearing, setIsClearing] = useState(false)

  const loadCacheSize = () => {
    const size = getAudioCacheSize()
    setCacheSize(size)
  }

  useEffect(() => {
    loadCacheSize()
  }, [])

  const handleClearCache = () => {
    if (Platform.OS === "web") {
      // Web doesn't have audio cache
      return
    }

    Alert.alert(
      "Clear Audio Cache",
      "This will delete all cached audio files. They will be re-downloaded when needed.",
      [
        {
          text: "Cancel",
          style: "cancel",
        },
        {
          text: "Clear",
          style: "destructive",
          onPress: async () => {
            setIsClearing(true)
            try {
              await clearAudioCache()
              setCacheSize(0)
            } catch (error) {
              console.error("Failed to clear cache:", error)
              Alert.alert("Error", "Failed to clear cache. Please try again.")
            } finally {
              setIsClearing(false)
            }
          },
        },
      ]
    )
  }

  return (
    <ListItem
      itemLeft={(props) => <HardDrive {...props} />}
      label="Clear Audio Cache"
      onPress={handleClearCache}
      itemRight={() => (
        <Text className="text-muted-foreground">
          {isClearing ? "Clearing..." : formatBytes(cacheSize)}
        </Text>
      )}
    />
  )
}
