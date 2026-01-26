import * as React from "react"
import { View, Pressable } from "react-native"
import { useRouter } from "expo-router"
import { ChevronDown, ChevronUp } from "lucide-react-native"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Text } from "@/components/ui/text"
import { Muted } from "@/components/ui/typography"
import { useColorScheme } from "@/lib/useColorScheme"

interface LevelDetailItem {
  total: number
  passed: number
  lessons: number
  inProgress: number
}

interface LevelProgressProps {
  level: number
  total: number
  passed: number
  percentage: number
  detail?: {
    radicals: LevelDetailItem
    kanji: LevelDetailItem
    vocabulary: LevelDetailItem
  }
}

export function LevelProgress({ level, total, passed, percentage, detail }: LevelProgressProps) {
  const router = useRouter()
  const { colorScheme } = useColorScheme()
  const [showDetail, setShowDetail] = React.useState(false)

  const chevronColor = colorScheme === "dark" ? "#9ca3af" : "#6b7280"

  const handleLevelPress = () => {
    router.push(`/browse/level/${level}`)
  }

  const renderDetailRow = (
    label: string,
    item: LevelDetailItem,
    color: string
  ) => {
    const remaining = item.total - item.passed
    return (
      <View className="flex-row items-center py-1.5">
        <View className="w-3 h-3 rounded mr-2" style={{ backgroundColor: color }} />
        <Text className="text-sm flex-1">{label}</Text>
        <View className="flex-row items-center gap-3">
          <Text className="text-xs text-muted-foreground">
            {item.lessons > 0 && <Text className="text-gray-500">{item.lessons} lessons</Text>}
          </Text>
          <Text className="text-xs text-muted-foreground">
            {item.inProgress > 0 && <Text className="text-pink-500">{item.inProgress} learning</Text>}
          </Text>
          <Text className="text-sm font-medium">
            {item.passed}/{item.total}
          </Text>
        </View>
      </View>
    )
  }

  return (
    <Card>
      <CardHeader className="pb-2">
        <Pressable 
          onPress={handleLevelPress}
          className="flex-row items-center justify-between"
        >
          <CardTitle className="text-lg">Level {level} Progress</CardTitle>
          <Text className="text-sm text-primary">View All</Text>
        </Pressable>
      </CardHeader>
      <CardContent className="gap-3">
        <View className="flex-row items-center gap-3">
          <View className="flex-1">
            <Progress value={percentage} className="h-3" />
          </View>
          <Text className="text-sm font-medium w-12 text-right">{percentage}%</Text>
        </View>
        <Muted>
          {passed} of {total} kanji passed to level up
        </Muted>

        {/* Expandable detail section */}
        {detail && (
          <>
            <Pressable
              onPress={() => setShowDetail(!showDetail)}
              className="flex-row items-center justify-center pt-2 border-t border-border"
            >
              <Text className="text-sm text-muted-foreground mr-1">
                {showDetail ? "Hide" : "Show"} breakdown
              </Text>
              {showDetail ? (
                <ChevronUp size={16} color={chevronColor} />
              ) : (
                <ChevronDown size={16} color={chevronColor} />
              )}
            </Pressable>

            {showDetail && (
              <View className="gap-1 pt-2">
                {renderDetailRow("Radicals", detail.radicals, "#3b82f6")}
                {renderDetailRow("Kanji", detail.kanji, "#ec4899")}
                {renderDetailRow("Vocabulary", detail.vocabulary, "#8b5cf6")}
              </View>
            )}
          </>
        )}
      </CardContent>
    </Card>
  )
}
