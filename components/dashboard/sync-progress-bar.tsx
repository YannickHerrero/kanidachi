import * as React from "react"
import { View, StyleSheet } from "react-native"
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
  interpolate,
  Extrapolation,
  runOnJS,
} from "react-native-reanimated"

import { useBackgroundSyncStore } from "@/stores/background-sync"
import { useThemeColors } from "@/hooks/useThemeColors"

const BAR_HEIGHT = 3
const FADE_IN_DURATION = 200
const FADE_OUT_DURATION = 600

/**
 * Thin progress bar that shows at the top of the dashboard during sync.
 * 
 * Following Tsurukame's pattern:
 * - Positioned at the very top of the screen
 * - Fades in when sync starts (200ms)
 * - Shows animated progress
 * - Fades out when sync completes (600ms)
 */
export function SyncProgressBar() {
  const colors = useThemeColors()
  const isSyncing = useBackgroundSyncStore((s) => s.isSyncing)
  const progress = useBackgroundSyncStore((s) => s.progress)
  
  const opacity = useSharedValue(0)
  const progressWidth = useSharedValue(0)
  const [isVisible, setIsVisible] = React.useState(false)

  // Handle sync start/end
  React.useEffect(() => {
    if (isSyncing) {
      // Sync started - show bar and fade in
      setIsVisible(true)
      opacity.value = withTiming(1, { duration: FADE_IN_DURATION })
      progressWidth.value = 0
    } else if (isVisible) {
      // Sync ended - complete the progress bar and fade out
      progressWidth.value = withSpring(100, { overshootClamping: true })
      opacity.value = withTiming(0, { duration: FADE_OUT_DURATION }, (finished) => {
        if (finished) {
          runOnJS(setIsVisible)(false)
        }
      })
    }
  }, [isSyncing, isVisible, opacity, progressWidth])

  // Update progress width when progress changes
  React.useEffect(() => {
    if (isSyncing && progress > 0) {
      progressWidth.value = withSpring(progress, { 
        overshootClamping: true,
        damping: 15,
        stiffness: 100,
      })
    }
  }, [progress, isSyncing, progressWidth])

  const containerStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
  }))

  const indicatorStyle = useAnimatedStyle(() => ({
    width: `${interpolate(
      progressWidth.value,
      [0, 100],
      [0, 100],
      Extrapolation.CLAMP
    )}%`,
  }))

  // Don't render if not visible (saves resources)
  if (!isVisible) {
    return null
  }

  const barColor = colors.background === '#0a0a0b' ? "#60a5fa" : "#3b82f6" // blue-400 / blue-500

  return (
    <Animated.View style={[styles.container, containerStyle]}>
      <View style={styles.track}>
        <Animated.View 
          style={[
            styles.indicator, 
            indicatorStyle,
            { backgroundColor: barColor }
          ]} 
        />
      </View>
    </Animated.View>
  )
}

const styles = StyleSheet.create({
  container: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    zIndex: 1000,
  },
  track: {
    height: BAR_HEIGHT,
    backgroundColor: "transparent",
    overflow: "hidden",
  },
  indicator: {
    height: "100%",
  },
})
