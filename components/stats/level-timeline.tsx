import * as React from "react"
import { View } from "react-native"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Text } from "@/components/ui/text"
import type { LevelProgressionData } from "@/hooks/useStatistics"

interface LevelTimelineProps {
  levelTimeline: LevelProgressionData[]
  currentLevel: number
}

export function LevelTimeline({ levelTimeline, currentLevel }: LevelTimelineProps) {
  const nowSeconds = Math.floor(Date.now() / 1000)

  const timelineEntries = React.useMemo(() => {
    const hasCurrent = levelTimeline.some(
      (entry) => entry.level === currentLevel && entry.passedAt === null
    )
    const baseEntries = hasCurrent
      ? [...levelTimeline]
      : [
          ...levelTimeline,
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
      .sort((a, b) => {
        const aSort =
          (a.level === currentLevel && a.passedAt === null
            ? a.startedAt ?? a.unlockedAt ?? nowSeconds
            : a.startedAt ?? a.unlockedAt ?? a.passedAt ?? a.completedAt ?? a.abandonedAt) ??
          0
        const bSort =
          (b.level === currentLevel && b.passedAt === null
            ? b.startedAt ?? b.unlockedAt ?? nowSeconds
            : b.startedAt ?? b.unlockedAt ?? b.passedAt ?? b.completedAt ?? b.abandonedAt) ??
          0
        return aSort - bSort
      })
  }, [currentLevel, levelTimeline, nowSeconds])

  const hasData = timelineEntries.length > 0

  // Format date from unix timestamp
  const formatDate = (timestamp: number | null) => {
    if (!timestamp) return null
    const date = new Date(timestamp * 1000)
    return date.toLocaleDateString(undefined, {
      month: "short",
      day: "numeric",
      year: "numeric",
    })
  }

  // Format duration in days
  const formatDuration = (days: number | null) => {
    if (days === null) return "In progress"
    if (days === 0) return "< 1 day"
    if (days === 1) return "1 day"
    return `${days} days`
  }

  // Calculate average time per level (excluding current level)
  const completedLevels = timelineEntries.filter(
    (l) => l.timeSpentDays !== null && l.passedAt !== null
  )
  const averageTime =
    completedLevels.length > 0
      ? Math.round(
          completedLevels.reduce((sum, l) => sum + (l.timeSpentDays ?? 0), 0) /
            completedLevels.length
        )
      : null

  // Get fastest and slowest levels
  const sortedByTime = [...completedLevels].sort(
    (a, b) => (a.timeSpentDays ?? 0) - (b.timeSpentDays ?? 0)
  )
  const fastest = sortedByTime[0]
  const slowest = sortedByTime[sortedByTime.length - 1]

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-lg">Level Progress</CardTitle>
      </CardHeader>
      <CardContent className="gap-4">
        {/* Summary stats */}
        {hasData && (
          <View className="flex-row flex-wrap gap-4 pb-2">
            <View className="flex-1 min-w-[100px]">
              <Text className="text-2xl font-bold text-foreground">
                {currentLevel}
              </Text>
              <Text className="text-xs text-muted-foreground">Current Level</Text>
            </View>
            {averageTime !== null && (
              <View className="flex-1 min-w-[100px]">
                <Text className="text-2xl font-bold text-foreground">
                  {averageTime}
                </Text>
                <Text className="text-xs text-muted-foreground">Avg. Days/Level</Text>
              </View>
            )}
            <View className="flex-1 min-w-[100px]">
              <Text className="text-2xl font-bold text-foreground">
                {completedLevels.length}
              </Text>
              <Text className="text-xs text-muted-foreground">Levels Passed</Text>
            </View>
          </View>
        )}

        {/* Fastest/Slowest */}
        {fastest && slowest && fastest.level !== slowest.level && (
          <View className="flex-row gap-4 py-2 border-t border-border">
            <View className="flex-1">
              <Text className="text-sm text-muted-foreground">Fastest</Text>
              <Text className="text-sm font-medium text-foreground">
                Level {fastest.level} ({formatDuration(fastest.timeSpentDays)})
              </Text>
            </View>
            <View className="flex-1">
              <Text className="text-sm text-muted-foreground">Slowest</Text>
              <Text className="text-sm font-medium text-foreground">
                Level {slowest.level} ({formatDuration(slowest.timeSpentDays)})
              </Text>
            </View>
          </View>
        )}

        {/* Timeline visualization */}
        {hasData && (
          <View className="gap-2 pt-2 border-t border-border">
            <Text className="text-sm font-medium text-muted-foreground">
              Timeline
            </Text>
            <View className="gap-1">
              {timelineEntries.slice(-10).map((level) => {
                const isCompleted = level.passedAt !== null
                const isCurrent = level.level === currentLevel

                return (
                  <View
                    key={level.id}
                    className="flex-row items-center gap-3"
                  >
                    {/* Level badge */}
                    <View
                      className={`w-8 h-8 rounded-full items-center justify-center ${
                        isCurrent
                          ? "bg-primary"
                          : isCompleted
                            ? "bg-muted"
                            : "bg-muted/50"
                      }`}
                    >
                      <Text
                        className={`text-sm font-medium ${
                          isCurrent ? "text-primary-foreground" : "text-foreground"
                        }`}
                      >
                        {level.level}
                      </Text>
                    </View>

                    {/* Progress bar for time spent */}
                    <View className="flex-1 gap-0.5">
                      <View className="flex-row justify-between">
                        <Text className="text-xs text-muted-foreground">
                          {formatDate(level.startedAt)}
                        </Text>
                        <Text className="text-xs font-medium text-foreground">
                          {formatDuration(level.timeSpentDays)}
                        </Text>
                      </View>
                      {/* Visual bar based on relative time */}
                      {averageTime && level.timeSpentDays !== null && (
                        <View className="h-1.5 rounded-full bg-muted overflow-hidden">
                          <View
                            className={`h-full rounded-full ${
                              level.timeSpentDays <= averageTime
                                ? "bg-green-500"
                                : level.timeSpentDays <= averageTime * 1.5
                                  ? "bg-yellow-500"
                                  : "bg-red-500"
                            }`}
                            style={{
                              width: `${Math.min(
                                100,
                                (level.timeSpentDays / (averageTime * 2)) * 100
                              )}%`,
                            }}
                          />
                        </View>
                      )}
                      {isCurrent && level.timeSpentDays === null && (
                        <View className="h-1.5 rounded-full bg-primary/30 overflow-hidden">
                          <View className="h-full w-1/3 rounded-full bg-primary animate-pulse" />
                        </View>
                      )}
                    </View>
                  </View>
                )
              })}
            </View>

            {timelineEntries.length > 10 && (
              <Text className="text-xs text-muted-foreground text-center pt-2">
                Showing last 10 levels
              </Text>
            )}
          </View>
        )}

        {/* Empty state */}
        {!hasData && (
          <View className="items-center py-4">
            <Text className="text-sm text-muted-foreground text-center">
              Start learning to see your level progress timeline
            </Text>
          </View>
        )}
      </CardContent>
    </Card>
  )
}
