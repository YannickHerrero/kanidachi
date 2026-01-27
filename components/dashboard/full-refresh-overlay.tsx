import * as React from "react"
import { View, StyleSheet, ActivityIndicator } from "react-native"
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withTiming,
  runOnJS,
} from "react-native-reanimated"

import { Text } from "@/components/ui/text"
import { useBackgroundSyncStore } from "@/stores/background-sync"

const FADE_IN_DURATION = 300
const FADE_OUT_DURATION = 300

/**
 * Fullscreen overlay shown during full refresh sync (pull-to-refresh).
 * 
 * Following Tsurukame's FullRefreshOverlayView pattern:
 * - Semi-transparent dark overlay covering the entire screen
 * - Centered loading spinner
 * - "Refreshing..." text
 * - Fades in/out with animation
 * - Only shown during full refresh, not quick syncs
 */
export function FullRefreshOverlay() {
  const isSyncing = useBackgroundSyncStore((s) => s.isSyncing)
  const isFullRefresh = useBackgroundSyncStore((s) => s.isFullRefresh)
  const progress = useBackgroundSyncStore((s) => s.progress)
  
  const opacity = useSharedValue(0)
  const [isVisible, setIsVisible] = React.useState(false)

  // Only show for full refresh syncs
  const shouldShow = isSyncing && isFullRefresh

  React.useEffect(() => {
    if (shouldShow) {
      // Full refresh started - show overlay and fade in
      setIsVisible(true)
      opacity.value = withTiming(1, { duration: FADE_IN_DURATION })
    } else if (isVisible) {
      // Full refresh ended - fade out
      opacity.value = withTiming(0, { duration: FADE_OUT_DURATION }, (finished) => {
        if (finished) {
          runOnJS(setIsVisible)(false)
        }
      })
    }
  }, [shouldShow, isVisible, opacity])

  const overlayStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
  }))

  // Don't render if not visible
  if (!isVisible) {
    return null
  }

  return (
    <Animated.View style={[styles.overlay, overlayStyle]} pointerEvents="auto">
      <View style={styles.content}>
        <ActivityIndicator size="large" color="#ffffff" />
        <Text style={styles.text}>Refreshing...</Text>
        {progress > 0 && progress < 100 && (
          <Text style={styles.progressText}>{Math.round(progress)}%</Text>
        )}
      </View>
    </Animated.View>
  )
}

const styles = StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "center",
    alignItems: "center",
    zIndex: 9999,
  },
  content: {
    alignItems: "center",
    gap: 16,
  },
  text: {
    color: "#ffffff",
    fontSize: 16,
    fontWeight: "500",
  },
  progressText: {
    color: "rgba(255, 255, 255, 0.7)",
    fontSize: 14,
  },
})
