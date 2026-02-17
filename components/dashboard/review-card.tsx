import * as React from "react"
import { Pressable, View, StyleSheet } from "react-native"
import { useRouter } from "expo-router"
import { BookOpen } from "lucide-react-native"

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
      longPressHandled.current = true
      router.push({ pathname: "/reviews", params: { mode: "express" } })
    }
  }

  return (
    <View style={styles.container}>
      <Pressable
        onPress={handlePress}
        onLongPress={handleLongPress}
        onPressOut={() => {
          longPressHandled.current = false
        }}
        delayLongPress={350}
        disabled={!hasReviews}
        style={styles.pressable}
      >
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
