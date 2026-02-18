import * as React from "react"
import { Pressable, StyleSheet, View } from "react-native"
import { ChevronDown, ChevronUp, Timer } from "lucide-react-native"

import { Card, CardContent } from "@/components/ui/card"
import { Text } from "@/components/ui/text"
import { useThemeColors } from "@/hooks/useThemeColors"
import { useDailyActivity } from "@/hooks/useDailyActivity"

function formatDuration(seconds: number): string {
  if (seconds < 60) {
    return `${seconds}s`
  }

  const totalMinutes = Math.floor(seconds / 60)
  const hours = Math.floor(totalMinutes / 60)
  const minutes = totalMinutes % 60

  if (hours > 0) {
    return `${hours}h ${minutes}m`
  }

  return `${minutes}m`
}

export function ActivityCard() {
  const colors = useThemeColors()
  const {
    reviews,
    lessons,
    lessonsQuiz,
    lessonsCompleted,
    expressReviewsCompleted,
    isLoading,
  } = useDailyActivity()
  const isDark = colors.background === "#0a0a0b"
  const [isExpanded, setIsExpanded] = React.useState(false)

  const totalSeconds = reviews + lessons + lessonsQuiz

  const toggleExpanded = () => {
    setIsExpanded((prev) => !prev)
  }

  return (
    <View style={styles.container}>
      <Card style={styles.card}>
        <CardContent className="p-4 gap-3">
          <View className="flex-row items-center gap-3">
            <View
              className="w-10 h-10 rounded-full items-center justify-center"
              style={{
                backgroundColor: isDark
                  ? "rgba(34, 197, 94, 0.18)"
                  : "rgba(34, 197, 94, 0.12)",
              }}
            >
              <Timer size={20} color={isDark ? "#4ade80" : "#22c55e"} />
            </View>
            <View className="flex-1">
              <Text className="text-base font-medium" style={{ color: colors.foreground }}>
                Today’s Study Time
              </Text>
              <Text className="text-sm" style={{ color: colors.mutedForeground }}>
                Reviews, lessons, and quiz time
              </Text>
            </View>
          </View>

          <View className="gap-3">
            <View className="flex-row items-center justify-between">
              <Text className="text-sm" style={{ color: colors.mutedForeground }}>
                Total Time
              </Text>
              <Text className="text-sm" style={{ color: colors.foreground }}>
                {isLoading ? "…" : formatDuration(totalSeconds)}
              </Text>
            </View>

            <View className="flex-row items-center justify-between">
              <Text className="text-sm" style={{ color: colors.mutedForeground }}>
                Lessons Learned
              </Text>
              <Text className="text-sm" style={{ color: colors.foreground }}>
                {isLoading ? "…" : lessonsCompleted}
              </Text>
            </View>

            <View className="flex-row items-center justify-between">
              <Text className="text-sm" style={{ color: colors.mutedForeground }}>
                Express Reviews
              </Text>
              <Text className="text-sm" style={{ color: colors.foreground }}>
                {isLoading ? "…" : expressReviewsCompleted}
              </Text>
            </View>

            <Pressable onPress={toggleExpanded} style={styles.expandToggle}>
              <Text className="text-sm" style={{ color: colors.primary }}>
                {isExpanded ? "Hide details" : "Show details"}
              </Text>
              {isExpanded ? (
                <ChevronUp size={16} color={colors.primary} />
              ) : (
                <ChevronDown size={16} color={colors.primary} />
              )}
            </Pressable>

            {isExpanded && (
              <View className="gap-2">
                <View className="flex-row items-center justify-between">
                  <Text className="text-sm" style={{ color: colors.mutedForeground }}>
                    Reviews
                  </Text>
                  <Text className="text-sm" style={{ color: colors.foreground }}>
                    {isLoading ? "…" : formatDuration(reviews)}
                  </Text>
                </View>
                <View className="flex-row items-center justify-between">
                  <Text className="text-sm" style={{ color: colors.mutedForeground }}>
                    Lessons
                  </Text>
                  <Text className="text-sm" style={{ color: colors.foreground }}>
                    {isLoading ? "…" : formatDuration(lessons)}
                  </Text>
                </View>
                <View className="flex-row items-center justify-between">
                  <Text className="text-sm" style={{ color: colors.mutedForeground }}>
                    Lesson Quiz
                  </Text>
                  <Text className="text-sm" style={{ color: colors.foreground }}>
                    {isLoading ? "…" : formatDuration(lessonsQuiz)}
                  </Text>
                </View>
              </View>
            )}
          </View>
        </CardContent>
      </Card>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  card: {
    flex: 1,
  },
  expandToggle: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
})
