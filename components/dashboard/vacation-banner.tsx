import * as React from "react"
import { View } from "react-native"
import { Palmtree } from "lucide-react-native"

import { Text } from "@/components/ui/text"
import { useThemeColors } from "@/hooks/useThemeColors"

interface VacationBannerProps {
  vacationStartedAt: number | null
}

/**
 * Shows a banner when the user has vacation mode enabled.
 */
export function VacationBanner({ vacationStartedAt }: VacationBannerProps) {
  const colors = useThemeColors()
  const isDark = colors.background === '#0a0a0b'

  if (!vacationStartedAt) {
    return null
  }

  // Calculate how long vacation has been active
  const vacationStart = new Date(vacationStartedAt * 1000)
  const now = new Date()
  const diffMs = now.getTime() - vacationStart.getTime()
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24))

  const durationText =
    diffDays === 0
      ? "Started today"
      : diffDays === 1
        ? "1 day"
        : `${diffDays} days`

  const iconColor = isDark ? "#4ade80" : "#16a34a"
  const textColor = isDark ? "#4ade80" : "#16a34a"
  const textColorFaded = isDark ? "rgba(74, 222, 128, 0.8)" : "rgba(22, 163, 74, 0.8)"

  return (
    <View
      className="flex-row items-center gap-3 rounded-lg px-4 py-3"
      style={{
        backgroundColor: 'rgba(34, 197, 94, 0.1)',
        borderWidth: 1,
        borderColor: 'rgba(34, 197, 94, 0.3)'
      }}
    >
      <Palmtree size={24} color={iconColor} />
      <View className="flex-1">
        <Text className="font-semibold" style={{ color: textColor }}>
          Vacation Mode Active
        </Text>
        <Text className="text-sm" style={{ color: textColorFaded }}>
          {durationText} - Reviews are paused
        </Text>
      </View>
    </View>
  )
}
