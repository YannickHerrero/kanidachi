import * as React from "react"
import { View } from "react-native"

import { Progress } from "@/components/ui/progress"
import { Text } from "@/components/ui/text"

interface ReviewProgressBarProps {
  current: number
  total: number
  completed: number
}

export function ReviewProgressBar({ current, total, completed }: ReviewProgressBarProps) {
  const percentage = total > 0 ? Math.round((current / total) * 100) : 0

  return (
    <View className="flex-row items-center gap-3 px-4">
      <View className="flex-1">
        <Progress value={percentage} className="h-2" />
      </View>
      <Text className="text-sm text-muted-foreground min-w-[60px] text-right">
        {current}/{total}
      </Text>
    </View>
  )
}
