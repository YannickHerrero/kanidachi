import * as React from "react"
import { Pressable, View } from "react-native"
import { useRouter } from "expo-router"

import { Text } from "@/components/ui/text"
import { cn } from "@/lib/utils"
import type { LevelData } from "@/hooks/useLevelProgress"
import { useThemeColors } from "@/hooks/useThemeColors"

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
  colors: ReturnType<typeof useThemeColors>
}

function LevelCell({ data, isCurrentLevel, isLocked, onPress, colors }: LevelCellProps) {
  // Progress bar color based on completion
  const getProgressColor = () => {
    if (isLocked) return colors.muted
    if (data.percentage === 100) return "#22c55e" // green-500
    if (data.percentage > 0) return "#3b82f6" // blue-500
    return colors.muted
  }

  const getBorderColor = () => {
    if (isCurrentLevel) return colors.primary
    if (isLocked) return colors.muted
    return colors.border
  }

  const getBackgroundColor = () => {
    if (isCurrentLevel) return colors.primary + '1A' // 10% opacity
    if (isLocked) return colors.muted + '4D' // 30% opacity
    return colors.card
  }

  const getTextColor = () => {
    if (isCurrentLevel) return colors.primary
    if (isLocked) return colors.mutedForeground
    return colors.foreground
  }

  return (
    <Pressable
      onPress={onPress}
      disabled={isLocked}
      className={cn("aspect-square rounded-lg items-center justify-center p-1", isLocked && "opacity-50")}
      style={{
        borderWidth: 2,
        borderColor: getBorderColor(),
        backgroundColor: getBackgroundColor(),
      }}
    >
      {/* Level number */}
      <Text className="text-lg font-semibold" style={{ color: getTextColor() }}>
        {data.level}
      </Text>

      {/* Progress bar */}
      <View className="w-full h-1.5 rounded-full mt-1 overflow-hidden" style={{ backgroundColor: colors.muted }}>
        <View
          className="h-full rounded-full"
          style={{ width: `${data.percentage}%`, backgroundColor: getProgressColor() }}
        />
      </View>
    </Pressable>
  )
}

export function LevelGrid({ levels, userLevel, maxLevel }: LevelGridProps) {
  const router = useRouter()
  const colors = useThemeColors()

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
                colors={colors}
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
