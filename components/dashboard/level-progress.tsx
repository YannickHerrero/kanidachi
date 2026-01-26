import * as React from "react"
import { View } from "react-native"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Text } from "@/components/ui/text"
import { Muted } from "@/components/ui/typography"

interface LevelProgressProps {
  level: number
  total: number
  passed: number
  percentage: number
}

export function LevelProgress({ level, total, passed, percentage }: LevelProgressProps) {
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-lg">Level {level} Progress</CardTitle>
      </CardHeader>
      <CardContent className="gap-3">
        <View className="flex-row items-center gap-3">
          <View className="flex-1">
            <Progress value={percentage} className="h-3" />
          </View>
          <Text className="text-sm font-medium w-12 text-right">{percentage}%</Text>
        </View>
        <Muted>
          {passed} of {total} kanji passed
        </Muted>
      </CardContent>
    </Card>
  )
}
