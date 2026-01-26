import * as React from "react"
import { View, Animated, Easing } from "react-native"
import { Loader2 } from "lucide-react-native"

import { useBackgroundSyncStore } from "@/stores/background-sync"
import { useColorScheme } from "@/lib/useColorScheme"

/**
 * Shows a small loading spinner in the header when background sync is running.
 * Returns null when not syncing.
 */
export function HeaderSyncIndicator() {
  const { colorScheme } = useColorScheme()
  const isSyncing = useBackgroundSyncStore((state) => state.isSyncing)
  const spinValue = React.useRef(new Animated.Value(0)).current

  React.useEffect(() => {
    if (isSyncing) {
      // Start spinning animation
      Animated.loop(
        Animated.timing(spinValue, {
          toValue: 1,
          duration: 1000,
          easing: Easing.linear,
          useNativeDriver: true,
        })
      ).start()
    } else {
      // Stop animation
      spinValue.setValue(0)
    }
  }, [isSyncing, spinValue])

  if (!isSyncing) {
    return null
  }

  const spin = spinValue.interpolate({
    inputRange: [0, 1],
    outputRange: ["0deg", "360deg"],
  })

  const iconColor = colorScheme === "dark" ? "#a1a1aa" : "#71717a"

  return (
    <View style={{ marginRight: 8 }}>
      <Animated.View style={{ transform: [{ rotate: spin }] }}>
        <Loader2 size={20} color={iconColor} />
      </Animated.View>
    </View>
  )
}
