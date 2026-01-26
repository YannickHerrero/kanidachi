import * as React from "react"
import { Pressable, View, StyleSheet } from "react-native"
import { useRouter } from "expo-router"
import { BookOpen } from "lucide-react-native"

import { Card, CardContent } from "@/components/ui/card"
import { Text } from "@/components/ui/text"
import { useColorScheme } from "@/lib/useColorScheme"

interface ReviewCardProps {
  count: number
}

// Note: Using View wrapper and style prop on Pressable to avoid NativeWind v4 bug
// that breaks layout when className is used on Pressable
// See AGENTS.md for details
export function ReviewCard({ count }: ReviewCardProps) {
  const router = useRouter()
  const { colorScheme } = useColorScheme()
  const hasReviews = count > 0

  const handlePress = () => {
    if (hasReviews) {
      router.push("/reviews")
    }
  }

  return (
    <View style={styles.container}>
      <Pressable onPress={handlePress} disabled={!hasReviews} style={styles.pressable}>
        <Card
          style={[
            styles.card,
            hasReviews ? styles.cardActive : styles.cardInactive,
          ]}
        >
          <CardContent className="p-4 items-center justify-center gap-2">
            <BookOpen
              size={24}
              color={hasReviews ? "#fff" : colorScheme === "dark" ? "#a1a1aa" : "#71717a"}
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
