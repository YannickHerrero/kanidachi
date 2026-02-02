import * as React from "react"
import { ScrollView, StyleSheet, View } from "react-native"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Text } from "@/components/ui/text"
import { useThemeColors } from "@/hooks/useThemeColors"

export interface DailyActivityDay {
  date: string
  reviewsSeconds: number
  lessonsSeconds: number
  lessonsQuizSeconds: number
}

interface DailyActivityChartProps {
  days: DailyActivityDay[]
}

function formatDateLabel(dateKey: string): string {
  const [year, month, day] = dateKey.split("-").map(Number)
  if (!year || !month || !day) return dateKey
  const date = new Date(year, month - 1, day)
  return `${date.getDate()}`
}

export function DailyActivityChart({ days }: DailyActivityChartProps) {
  const colors = useThemeColors()
  const isDark = colors.background === "#0a0a0b"
  const reviewColor = isDark ? "#a1a1aa" : "#71717a"
  const lessonColor = isDark ? "#e4e4e7" : "#a1a1aa"
  const chartHeight = 140
  const scrollRef = React.useRef<ScrollView | null>(null)

  const normalizedDays = React.useMemo(() => {
    return days.map((day) => {
      const lessonSeconds = day.lessonsSeconds + day.lessonsQuizSeconds
      const reviewSeconds = day.reviewsSeconds
      return {
        ...day,
        lessonSeconds,
        reviewSeconds,
        totalSeconds: lessonSeconds + reviewSeconds,
      }
    })
  }, [days])

  const hasData = normalizedDays.some((day) => day.totalSeconds > 0)
  const maxSeconds = hasData
    ? Math.max(...normalizedDays.map((day) => day.totalSeconds), 1)
    : 1

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-lg">Study Time (Last 30 Days)</CardTitle>
      </CardHeader>
      <CardContent className="gap-4">
        <View className="flex-row items-center gap-4">
          <View className="flex-row items-center gap-2">
            <View style={[styles.legendDot, { backgroundColor: lessonColor }]} />
            <Text className="text-xs" style={{ color: colors.mutedForeground }}>
              Lessons
            </Text>
          </View>
          <View className="flex-row items-center gap-2">
            <View style={[styles.legendDot, { backgroundColor: reviewColor }]} />
            <Text className="text-xs" style={{ color: colors.mutedForeground }}>
              Reviews
            </Text>
          </View>
        </View>

        {hasData ? (
          <ScrollView
            ref={scrollRef}
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerClassName="gap-3 px-1 pb-2"
            onContentSizeChange={() => {
              scrollRef.current?.scrollToEnd({ animated: false })
            }}
          >
            {normalizedDays.map((day) => {
              const totalHeight = Math.max(6, Math.round((day.totalSeconds / maxSeconds) * chartHeight))
              const reviewHeight = day.totalSeconds > 0
                ? Math.round((day.reviewSeconds / day.totalSeconds) * totalHeight)
                : 0
              const lessonHeight = Math.max(0, totalHeight - reviewHeight)

              return (
                <View key={day.date} className="items-center">
                  <View style={[styles.barContainer, { height: chartHeight }]} className="justify-end">
                    <View
                      style={[
                        styles.barSegment,
                        {
                          height: lessonHeight,
                          backgroundColor: lessonColor,
                          borderBottomLeftRadius: 0,
                          borderBottomRightRadius: 0,
                        },
                      ]}
                    />
                    <View
                      style={[
                        styles.barSegment,
                        {
                          height: reviewHeight,
                          backgroundColor: reviewColor,
                          borderTopLeftRadius: 0,
                          borderTopRightRadius: 0,
                        },
                      ]}
                    />
                  </View>
                  <Text className="text-[10px]" style={{ color: colors.mutedForeground }}>
                    {formatDateLabel(day.date)}
                  </Text>
                </View>
              )
            })}
          </ScrollView>
        ) : (
          <View className="items-center py-4">
            <Text className="text-sm text-center" style={{ color: colors.mutedForeground }}>
              Study sessions will appear here once you start reviewing or lessons
            </Text>
          </View>
        )}
      </CardContent>
    </Card>
  )
}

const styles = StyleSheet.create({
  legendDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  barContainer: {
    width: 18,
    borderRadius: 8,
    backgroundColor: "rgba(148, 163, 184, 0.18)",
    overflow: "hidden",
    paddingTop: 6,
    justifyContent: "flex-end",
  },
  barSegment: {
    width: "100%",
    borderRadius: 8,
  },
})
