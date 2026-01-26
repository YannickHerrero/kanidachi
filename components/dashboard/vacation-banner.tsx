import * as React from "react"
import { View } from "react-native"
import { Palmtree } from "lucide-react-native"

import { Text } from "@/components/ui/text"
import { useColorScheme } from "@/lib/useColorScheme"

interface VacationBannerProps {
  vacationStartedAt: number | null
}

/**
 * Shows a banner when the user has vacation mode enabled.
 */
export function VacationBanner({ vacationStartedAt }: VacationBannerProps) {
  const { colorScheme } = useColorScheme()

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

  const iconColor = colorScheme === "dark" ? "#4ade80" : "#16a34a"

  return (
    <View className="flex-row items-center gap-3 bg-green-500/10 border border-green-500/30 rounded-lg px-4 py-3">
      <Palmtree size={24} color={iconColor} />
      <View className="flex-1">
        <Text className="text-green-600 dark:text-green-400 font-semibold">
          Vacation Mode Active
        </Text>
        <Text className="text-green-600/80 dark:text-green-400/80 text-sm">
          {durationText} - Reviews are paused
        </Text>
      </View>
    </View>
  )
}
