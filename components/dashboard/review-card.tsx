import * as React from "react"
import { Animated, Easing, Pressable, View, StyleSheet } from "react-native"
import { useRouter } from "expo-router"
import { BookOpen } from "lucide-react-native"
import * as Haptics from "expo-haptics"

import { Card, CardContent } from "@/components/ui/card"
import { Text } from "@/components/ui/text"
import { useThemeColors } from "@/hooks/useThemeColors"

interface ReviewCardProps {
  count: number
}

// Note: Using View wrapper and style prop on Pressable to avoid NativeWind v4 bug
// that breaks layout when className is used on Pressable
// See AGENTS.md for details
export function ReviewCard({ count }: ReviewCardProps) {
  const router = useRouter()
  const colors = useThemeColors()
  const hasReviews = count > 0
  const longPressHandled = React.useRef(false)
  const scaleAnim = React.useRef(new Animated.Value(1)).current
  const hapticTimeoutRef = React.useRef<ReturnType<typeof setTimeout> | null>(null)
  const isChargingRef = React.useRef(false)

  const stopCharge = React.useCallback(() => {
    if (hapticTimeoutRef.current) {
      clearTimeout(hapticTimeoutRef.current)
      hapticTimeoutRef.current = null
    }
    isChargingRef.current = false
    Animated.spring(scaleAnim, {
      toValue: 1,
      useNativeDriver: true,
      friction: 6,
      tension: 140,
    }).start()
  }, [scaleAnim])

  const startCharge = React.useCallback(() => {
    if (isChargingRef.current) return
    isChargingRef.current = true

    Animated.timing(scaleAnim, {
      toValue: 1.05,
      duration: 550,
      easing: Easing.out(Easing.quad),
      useNativeDriver: true,
    }).start()

    let interval = 200
    const tick = () => {
      if (!isChargingRef.current) return
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)
      interval = Math.max(40, Math.floor(interval * 0.6))
      hapticTimeoutRef.current = setTimeout(tick, interval)
    }

    hapticTimeoutRef.current = setTimeout(tick, interval)
  }, [scaleAnim])

  const handlePress = () => {
    if (hasReviews) {
      if (longPressHandled.current) {
        longPressHandled.current = false
        return
      }
      router.push("/reviews")
    }
  }

  const handleLongPress = () => {
    if (hasReviews) {
      stopCharge()
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium)
      longPressHandled.current = true
      router.push({ pathname: "/reviews", params: { mode: "express" } })
    }
  }

  return (
    <View style={styles.container}>
      <Pressable
        onPress={handlePress}
        onPressIn={() => {
          if (hasReviews) startCharge()
        }}
        onLongPress={handleLongPress}
        onPressOut={() => {
          longPressHandled.current = false
          stopCharge()
        }}
        delayLongPress={550}
        disabled={!hasReviews}
        style={styles.pressable}
      >
        <Animated.View style={{ transform: [{ scale: scaleAnim }] }}>
          <Card
            style={[
              styles.card,
              hasReviews ? styles.cardActive : styles.cardInactive,
            ]}
          >
            <CardContent className="p-4 items-center justify-center gap-2">
              <BookOpen
                size={24}
                color={hasReviews ? "#fff" : colors.mutedForeground}
              />
              <Text
                style={hasReviews ? styles.countActive : styles.countInactive}
                className="text-4xl font-semibold"
              >
                {count}
              </Text>
              <Text
                style={hasReviews ? styles.labelActive : styles.labelInactive}
                className="text-sm"
              >
                Reviews
              </Text>
            </CardContent>
          </Card>
        </Animated.View>
      </Pressable>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  pressable: {
    flex: 1,
  },
  card: {
    flex: 1,
  },
  cardActive: {
    backgroundColor: "#ec4899", // pink-500
    borderColor: "#db2777", // pink-600
  },
  cardInactive: {
    opacity: 0.6,
  },
  countActive: {
    color: "#fff",
  },
  countInactive: {
    color: "#71717a", // muted-foreground
  },
  labelActive: {
    color: "rgba(255, 255, 255, 0.9)", // text-white/90
  },
  labelInactive: {
    color: "#71717a", // muted-foreground
  },
})
