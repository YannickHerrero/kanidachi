import * as React from "react"
import { View, Pressable } from "react-native"
import { useRouter } from "expo-router"
import { ChevronRight } from "lucide-react-native"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Text } from "@/components/ui/text"
import { useThemeColors } from "@/hooks/useThemeColors"

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
  const router = useRouter()
  const colors = useThemeColors()
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

  const handleCategoryPress = (category: string) => {
    router.push(`/browse/srs/${category}`)
  }

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-lg">SRS Progress</CardTitle>
      </CardHeader>
      <CardContent className="gap-4">
        {/* Stacked bar */}
        <View className="h-6 flex-row rounded-full overflow-hidden" style={{ backgroundColor: colors.muted }}>
          {segments.map((segment) => {
            const width = getWidth(segment.count)
            if (width === 0) return null
            return (
              <Pressable
                key={segment.key}
                onPress={() => handleCategoryPress(segment.key)}
                style={{
                  width: `${width}%`,
                  backgroundColor: segment.color,
                }}
              />
            )
          })}
        </View>

        {/* Legend - clickable items */}
        <View className="gap-2">
          {segments.map((segment) => (
            <Pressable
              key={segment.key}
              onPress={() => handleCategoryPress(segment.key)}
              className="flex-row items-center py-1"
              disabled={segment.count === 0}
            >
              <View
                className="w-3 h-3 rounded-full mr-2"
                style={{ backgroundColor: segment.color }}
              />
              <Text className="text-sm flex-1" style={{ color: colors.mutedForeground }}>
                {segment.label}
              </Text>
              <Text className="font-medium mr-1" style={{ color: colors.foreground }}>
                {segment.count}
              </Text>
              {segment.count > 0 && (
                <ChevronRight size={16} color={colors.mutedForeground} />
              )}
            </Pressable>
          ))}
        </View>

        {/* Total */}
        <Text className="text-sm" style={{ color: colors.mutedForeground }}>
          Total items: <Text className="font-medium" style={{ color: colors.foreground }}>{total}</Text>
        </Text>
      </CardContent>
    </Card>
  )
}
