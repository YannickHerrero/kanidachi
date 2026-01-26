import * as React from "react"
import { Pressable, View } from "react-native"
import { useRouter } from "expo-router"

import { Text } from "@/components/ui/text"
import { cn } from "@/lib/utils"
import type { LevelData } from "@/hooks/useLevelProgress"

interface LevelGridProps {
  levels: LevelData[]
  userLevel: number
  maxLevel: number
}

interface LevelCellProps {
  data: LevelData
  isCurrentLevel: boolean
  isLocked: boolean
  onPress: () => void
}

function LevelCell({ data, isCurrentLevel, isLocked, onPress }: LevelCellProps) {
  // Progress bar color based on completion
  const getProgressColor = () => {
    if (isLocked) return "bg-muted"
    if (data.percentage === 100) return "bg-green-500"
    if (data.percentage > 0) return "bg-blue-500"
    return "bg-muted"
  }

  return (
    <Pressable
      onPress={onPress}
      disabled={isLocked}
      className={cn(
        "aspect-square rounded-lg border-2 items-center justify-center p-1",
        isCurrentLevel
          ? "border-primary bg-primary/10"
          : isLocked
            ? "border-muted bg-muted/30 opacity-50"
            : "border-border bg-card"
      )}
    >
      {/* Level number */}
      <Text
        className={cn(
          "text-lg font-semibold",
          isCurrentLevel
            ? "text-primary"
            : isLocked
              ? "text-muted-foreground"
              : "text-foreground"
        )}
      >
        {data.level}
      </Text>

      {/* Progress bar */}
      <View className="w-full h-1.5 bg-muted rounded-full mt-1 overflow-hidden">
        <View
          className={cn("h-full rounded-full", getProgressColor())}
          style={{ width: `${data.percentage}%` }}
        />
      </View>
    </Pressable>
  )
}

export function LevelGrid({ levels, userLevel, maxLevel }: LevelGridProps) {
  const router = useRouter()

  const handleLevelPress = (level: number) => {
    router.push(`/browse/level/${level}`)
  }

  // Group levels into rows of 6
  const rows: LevelData[][] = []
  for (let i = 0; i < levels.length; i += 6) {
    rows.push(levels.slice(i, i + 6))
  }

  return (
    <View className="gap-2">
      {rows.map((row, rowIndex) => (
        <View key={rowIndex} className="flex-row gap-2">
          {row.map((levelData) => (
            <View key={levelData.level} className="flex-1">
              <LevelCell
                data={levelData}
                isCurrentLevel={levelData.level === userLevel}
                isLocked={levelData.level > maxLevel}
                onPress={() => handleLevelPress(levelData.level)}
              />
            </View>
          ))}
          {/* Fill empty cells if row is incomplete */}
          {row.length < 6 &&
            Array(6 - row.length)
              .fill(0)
              .map((_, i) => <View key={`empty-${i}`} className="flex-1" />)}
        </View>
      ))}
    </View>
  )
}
