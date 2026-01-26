import * as React from "react"
import { View } from "react-native"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Text } from "@/components/ui/text"
import type { AccuracyStats, AccuracyByType } from "@/hooks/useStatistics"

// Colors for subject types
const SUBJECT_TYPE_COLORS = {
  radical: "#00AAFF", // Blue
  kanji: "#FF00AA", // Pink
  vocabulary: "#AA00FF", // Purple
  kana_vocabulary: "#AA00FF", // Purple (same as vocabulary)
} as const

interface AccuracyChartProps {
  overallAccuracy: AccuracyStats
  accuracyByType: AccuracyByType[]
  totalReviews: number
}

export function AccuracyChart({
  overallAccuracy,
  accuracyByType,
  totalReviews,
}: AccuracyChartProps) {
  const hasData = totalReviews > 0

  // Format subject type label
  const formatType = (type: string) => {
    switch (type) {
      case "radical":
        return "Radicals"
      case "kanji":
        return "Kanji"
      case "vocabulary":
        return "Vocabulary"
      case "kana_vocabulary":
        return "Kana Vocabulary"
      default:
        return type
    }
  }

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-lg">Accuracy</CardTitle>
      </CardHeader>
      <CardContent className="gap-4">
        {/* Overall accuracy circle */}
        <View className="items-center py-4">
          <View className="relative w-32 h-32 items-center justify-center">
            {/* Background circle */}
            <View className="absolute w-full h-full rounded-full border-8 border-muted" />
            {/* Progress circle (using a simple percentage-based approach) */}
            {hasData && (
              <View
                className="absolute w-full h-full rounded-full border-8 border-primary"
                style={{
                  transform: [{ rotate: "-90deg" }],
                  borderRightColor: "transparent",
                  borderBottomColor: overallAccuracy.percentage > 25 ? undefined : "transparent",
                  borderLeftColor: overallAccuracy.percentage > 50 ? undefined : "transparent",
                  borderTopColor: overallAccuracy.percentage > 75 ? undefined : "transparent",
                }}
              />
            )}
            {/* Percentage text */}
            <Text className="text-3xl font-bold text-foreground">
              {hasData ? `${overallAccuracy.percentage}%` : "—"}
            </Text>
            <Text className="text-sm text-muted-foreground">accuracy</Text>
          </View>
        </View>

        {/* Total reviews */}
        <View className="items-center pb-2">
          <Text className="text-sm text-muted-foreground">
            Total answers:{" "}
            <Text className="font-medium text-foreground">
              {totalReviews.toLocaleString()}
            </Text>
          </Text>
          <Text className="text-xs text-muted-foreground">
            ({overallAccuracy.totalCorrect.toLocaleString()} correct,{" "}
            {overallAccuracy.totalIncorrect.toLocaleString()} incorrect)
          </Text>
        </View>

        {/* Accuracy by type */}
        {accuracyByType.length > 0 && (
          <View className="gap-3 pt-2 border-t border-border">
            <Text className="text-sm font-medium text-muted-foreground">
              By Type
            </Text>
            {accuracyByType.map((item) => (
              <View key={item.subjectType} className="gap-1">
                <View className="flex-row justify-between items-center">
                  <View className="flex-row items-center gap-2">
                    <View
                      className="w-3 h-3 rounded-full"
                      style={{
                        backgroundColor:
                          SUBJECT_TYPE_COLORS[item.subjectType as keyof typeof SUBJECT_TYPE_COLORS] ??
                          "#888888",
                      }}
                    />
                    <Text className="text-sm text-foreground">
                      {formatType(item.subjectType)}
                    </Text>
                  </View>
                  <Text className="text-sm font-medium text-foreground">
                    {item.percentage}%
                  </Text>
                </View>
                {/* Progress bar */}
                <View className="h-2 rounded-full bg-muted overflow-hidden">
                  <View
                    className="h-full rounded-full"
                    style={{
                      width: `${item.percentage}%`,
                      backgroundColor:
                        SUBJECT_TYPE_COLORS[item.subjectType as keyof typeof SUBJECT_TYPE_COLORS] ??
                        "#888888",
                    }}
                  />
                </View>
              </View>
            ))}
          </View>
        )}

        {/* Empty state */}
        {!hasData && (
          <View className="items-center py-4">
            <Text className="text-sm text-muted-foreground text-center">
              Complete some reviews to see your accuracy statistics
            </Text>
          </View>
        )}
      </CardContent>
    </Card>
  )
}
