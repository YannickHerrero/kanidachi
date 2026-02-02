import * as React from "react"
import { ScrollView, StyleSheet, View } from "react-native"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Text } from "@/components/ui/text"
import { useThemeColors } from "@/hooks/useThemeColors"
import type { LevelProgressionData } from "@/hooks/useStatistics"

interface LevelTimeChartProps {
  levelTimeline: LevelProgressionData[]
  currentLevel: number
}

function getPercentile(values: number[], percentile: number): number {
  if (values.length === 0) return 0
  const sorted = [...values].sort((a, b) => a - b)
  if (sorted.length === 1) return sorted[0]
  const clampedPercentile = Math.min(1, Math.max(0, percentile))
  const index = (sorted.length - 1) * clampedPercentile
  const lower = Math.floor(index)
  const upper = Math.ceil(index)
  if (lower === upper) return sorted[lower]
  const weight = index - lower
  return sorted[lower] * (1 - weight) + sorted[upper] * weight
}

export function LevelTimeChart({ levelTimeline, currentLevel }: LevelTimeChartProps) {
  const colors = useThemeColors()
  const scrollRef = React.useRef<ScrollView | null>(null)
  const nowSeconds = Math.floor(Date.now() / 1000)
  const timelineEntries = React.useMemo(() => {
    const getEntryTimestamp = (entry: LevelProgressionData) => {
      return (
        entry.startedAt ??
        entry.unlockedAt ??
        entry.passedAt ??
        entry.completedAt ??
        entry.abandonedAt ??
        0
      )
    }

    const latestByLevel = new Map<number, LevelProgressionData>()
    for (const entry of levelTimeline) {
      const existing = latestByLevel.get(entry.level)
      const isCurrentInProgress = entry.level === currentLevel && entry.passedAt === null
      const existingIsCurrentInProgress =
        existing?.level === currentLevel && existing.passedAt === null

      if (
        !existing ||
        isCurrentInProgress ||
        (!existingIsCurrentInProgress &&
          getEntryTimestamp(entry) > getEntryTimestamp(existing))
      ) {
        latestByLevel.set(entry.level, entry)
      }
    }

    const hasCurrent = levelTimeline.some(
      (entry) => entry.level === currentLevel && entry.passedAt === null
    )

    const baseEntries = hasCurrent
      ? Array.from(latestByLevel.values())
      : [
          ...latestByLevel.values(),
          {
            id: -currentLevel,
            level: currentLevel,
            unlockedAt: null,
            startedAt: null,
            passedAt: null,
            completedAt: null,
            abandonedAt: null,
            timeSpentDays: null,
          },
        ]

    return baseEntries
      .map((entry) => {
        if (entry.level !== currentLevel || entry.passedAt !== null) return entry

        const startedAt = entry.startedAt ?? entry.unlockedAt
        if (!startedAt) return entry

        const timeSpentDays = Math.max(
          0,
          Math.round((nowSeconds - startedAt) / (60 * 60 * 24))
        )

        return {
          ...entry,
          timeSpentDays,
        }
      })
      .sort((a, b) => getEntryTimestamp(a) - getEntryTimestamp(b))
  }, [currentLevel, levelTimeline, nowSeconds])

  const completedLevels = React.useMemo(() => {
    return timelineEntries.filter(
      (level) => level.timeSpentDays !== null && level.passedAt !== null
    )
  }, [timelineEntries])
  const chartLevels = React.useMemo(() => {
    return timelineEntries.filter((level) => level.timeSpentDays !== null)
  }, [timelineEntries])
  const hasChartData = chartLevels.length > 0
  const hasSummaryData = completedLevels.length > 0

  const maxDays = hasChartData
    ? Math.max(...chartLevels.map((level) => level.timeSpentDays ?? 0), 1)
    : 1
  const scaleDays = hasChartData
    ? Math.max(
        getPercentile(
          chartLevels.map((level) => level.timeSpentDays ?? 0),
          0.95
        ),
        1
      )
    : 1
  const averageDays = hasSummaryData
    ? Math.round(
        completedLevels.reduce((sum, level) => sum + (level.timeSpentDays ?? 0), 0) /
          completedLevels.length
      )
    : 0

  const barColor = colors.background === '#0a0a0b' ? "#a78bfa" : "#7c3aed"
  const chartHeight = 140

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-lg">Time per Level</CardTitle>
      </CardHeader>
      <CardContent className="gap-4">
        {hasSummaryData && (
          <View className="flex-row flex-wrap gap-4 pb-2">
            <View className="flex-1 min-w-[100px]">
              <Text className="text-2xl font-bold" style={{ color: colors.foreground }}>
                {averageDays}
              </Text>
              <Text className="text-xs" style={{ color: colors.mutedForeground }}>Avg. Days/Level</Text>
            </View>
            <View className="flex-1 min-w-[100px]">
              <Text className="text-2xl font-bold" style={{ color: colors.foreground }}>{maxDays}</Text>
              <Text className="text-xs" style={{ color: colors.mutedForeground }}>Longest Level</Text>
            </View>
            <View className="flex-1 min-w-[100px]">
              <Text className="text-2xl font-bold" style={{ color: colors.foreground }}>
                {completedLevels.length}
              </Text>
              <Text className="text-xs" style={{ color: colors.mutedForeground }}>Levels Completed</Text>
            </View>
          </View>
        )}

        {hasChartData && (
          <View className="pt-2 border-t" style={{ borderColor: colors.border }}>
            <Text className="text-sm font-medium pb-2" style={{ color: colors.mutedForeground }}>
              Days to level up
            </Text>
            <ScrollView
              ref={scrollRef}
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerClassName="gap-3 px-1 pb-2"
              onContentSizeChange={() => {
                scrollRef.current?.scrollToEnd({ animated: false })
              }}
            >
              {chartLevels.map((level) => {
                const timeSpent = level.timeSpentDays ?? 0
                const displayValue = Math.min(timeSpent, scaleDays)
                const barHeight = Math.max(6, Math.round((displayValue / scaleDays) * chartHeight))
                const isCapped = timeSpent > scaleDays

                return (
                  <View key={level.id} className="items-center">
                    <View style={[styles.barContainer, { height: chartHeight }]}
                      className="justify-end"
                    >
                      {isCapped && (
                        <View
                          style={[
                            styles.cap,
                            {
                              backgroundColor: barColor,
                            },
                          ]}
                        />
                      )}
                      <View
                        style={[
                          styles.bar,
                          {
                            height: barHeight,
                            backgroundColor: barColor,
                          },
                        ]}
                      />
                    </View>
                    <Text className="text-xs" style={{ color: colors.foreground }}>{level.level}</Text>
                    <Text className="text-[10px]" style={{ color: colors.mutedForeground }}>
                      {timeSpent}d
                    </Text>
                  </View>
                )
              })}
            </ScrollView>
          </View>
        )}

        {!hasChartData && (
          <View className="items-center py-4">
            <Text className="text-sm text-center" style={{ color: colors.mutedForeground }}>
              Complete a level to see time spent per level
            </Text>
          </View>
        )}
      </CardContent>
    </Card>
  )
}

const styles = StyleSheet.create({
  barContainer: {
    width: 26,
    borderRadius: 8,
    backgroundColor: "rgba(148, 163, 184, 0.18)",
    overflow: "hidden",
    paddingTop: 6,
  },
  bar: {
    width: "100%",
    borderRadius: 8,
  },
  cap: {
    position: "absolute",
    left: 4,
    right: 4,
    top: 4,
    height: 2,
    borderRadius: 4,
  },
})
