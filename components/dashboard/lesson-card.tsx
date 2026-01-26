import * as React from "react"
import { Pressable, View, StyleSheet } from "react-native"
import { useRouter } from "expo-router"
import { GraduationCap } from "lucide-react-native"

import { Card, CardContent } from "@/components/ui/card"
import { Text } from "@/components/ui/text"
import { useColorScheme } from "@/lib/useColorScheme"

interface LessonCardProps {
  count: number
}

// Note: Using View wrapper and style prop on Pressable to avoid NativeWind v4 bug
// that breaks layout when className is used on Pressable
// See AGENTS.md for details
export function LessonCard({ count }: LessonCardProps) {
  const router = useRouter()
  const { colorScheme } = useColorScheme()
  const hasLessons = count > 0

  const handlePress = () => {
    if (hasLessons) {
      router.push("/lessons")
    }
  }

  return (
    <View style={styles.container}>
      <Pressable onPress={handlePress} disabled={!hasLessons} style={styles.pressable}>
        <Card
          style={[
            styles.card,
            hasLessons ? styles.cardActive : styles.cardInactive,
          ]}
        >
          <CardContent className="p-4 items-center justify-center gap-2">
            <GraduationCap
              size={24}
              color={hasLessons ? "#fff" : colorScheme === "dark" ? "#a1a1aa" : "#71717a"}
            />
            <Text
              style={hasLessons ? styles.countActive : styles.countInactive}
              className="text-4xl font-semibold"
            >
              {count}
            </Text>
            <Text
              style={hasLessons ? styles.labelActive : styles.labelInactive}
              className="text-sm"
            >
              Lessons
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
    backgroundColor: "#3b82f6", // blue-500
    borderColor: "#2563eb", // blue-600
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
