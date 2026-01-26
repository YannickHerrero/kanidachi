import * as React from "react"
import { View } from "react-native"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Text } from "@/components/ui/text"

// WaniKani SRS colors
const SRS_COLORS = {
  apprentice: "#DD0093", // Pink
  guru: "#882D9E", // Purple
  master: "#294DDB", // Blue
  enlightened: "#0093DD", // Light blue
  burned: "#434343", // Gray
} as const

interface SrsBreakdownProps {
  apprentice: number
  guru: number
  master: number
  enlightened: number
  burned: number
}

export function SrsBreakdown({
  apprentice,
  guru,
  master,
  enlightened,
  burned,
}: SrsBreakdownProps) {
  const total = apprentice + guru + master + enlightened + burned

  // Calculate percentages for each segment
  const getWidth = (count: number) => {
    if (total === 0) return 0
    return (count / total) * 100
  }

  const segments = [
    { key: "apprentice", count: apprentice, color: SRS_COLORS.apprentice, label: "Apprentice" },
    { key: "guru", count: guru, color: SRS_COLORS.guru, label: "Guru" },
    { key: "master", count: master, color: SRS_COLORS.master, label: "Master" },
    { key: "enlightened", count: enlightened, color: SRS_COLORS.enlightened, label: "Enlightened" },
    { key: "burned", count: burned, color: SRS_COLORS.burned, label: "Burned" },
  ]

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-lg">SRS Progress</CardTitle>
      </CardHeader>
      <CardContent className="gap-4">
        {/* Stacked bar */}
        <View className="h-6 flex-row rounded-full overflow-hidden bg-muted">
          {segments.map((segment) => {
            const width = getWidth(segment.count)
            if (width === 0) return null
            return (
              <View
                key={segment.key}
                style={{
                  width: `${width}%`,
                  backgroundColor: segment.color,
                }}
              />
            )
          })}
        </View>

        {/* Legend */}
        <View className="flex-row flex-wrap gap-x-4 gap-y-2">
          {segments.map((segment) => (
            <View key={segment.key} className="flex-row items-center gap-2">
              <View
                className="w-3 h-3 rounded-full"
                style={{ backgroundColor: segment.color }}
              />
              <Text className="text-sm text-muted-foreground">
                {segment.label}:{" "}
                <Text className="font-medium text-foreground">{segment.count}</Text>
              </Text>
            </View>
          ))}
        </View>

        {/* Total */}
        <Text className="text-sm text-muted-foreground">
          Total items: <Text className="font-medium text-foreground">{total}</Text>
        </Text>
      </CardContent>
    </Card>
  )
}
