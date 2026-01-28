import * as React from "react"
import { View } from "react-native"

import { Progress } from "@/components/ui/progress"
import { Text } from "@/components/ui/text"
import { useThemeColors } from "@/hooks/useThemeColors"

interface ReviewProgressBarProps {
  current: number
  total: number
  completed: number
}

export function ReviewProgressBar({ current, total, completed }: ReviewProgressBarProps) {
  const colors = useThemeColors()
  const percentage = total > 0 ? Math.round((current / total) * 100) : 0

  return (
    <View className="flex-row items-center gap-3">
      <View className="flex-1">
        <Progress value={percentage} className="h-2" />
      </View>
      <Text className="text-sm min-w-[60px] text-right" style={{ color: colors.mutedForeground }}>
        {current}/{total}
      </Text>
    </View>
  )
}
