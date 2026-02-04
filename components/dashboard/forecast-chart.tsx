import * as React from "react"
import { View } from "react-native"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Text } from "@/components/ui/text"
import { Muted } from "@/components/ui/typography"
import { useThemeColors } from "@/hooks/useThemeColors"

interface ForecastChartProps {
  /** Array of { hour: number, count: number } for next 24 hours */
  forecast: Array<{ hour: number; count: number }>
}

export function ForecastChart({ forecast }: ForecastChartProps) {
  const colors = useThemeColors()
  const hourFormatter = React.useMemo(
    () =>
      new Intl.DateTimeFormat(undefined, {
        hour: "numeric",
        hour12: true,
      }),
    []
  )

  // Build cumulative forecast data
  // hour 0 = now, hour 1 = +1h, etc.
  const hours = React.useMemo(() => {
    // Create a map of hour -> count from forecast data
    const forecastMap = new Map<number, number>()
    for (const item of forecast) {
      forecastMap.set(item.hour, item.count)
    }

    // Generate 12 time slots (now, +1h, +2h, ..., +11h)
    // or show next day if nothing in first 12 hours
    const slots: Array<{ label: string; count: number }> = []

    const now = new Date()

    for (let h = 0; h < 12; h++) {
      const count = forecastMap.get(h) ?? 0
      const slotTime = new Date(now.getTime() + (h + 1) * 60 * 60 * 1000)
      const label = hourFormatter
        .format(slotTime)
        .replace(/\s+/g, "")
        .replace(/\./g, "")
        .toLowerCase()
      slots.push({ label, count })
    }

    return slots
  }, [forecast, hourFormatter])

  // Find max for scaling
  const maxCount = Math.max(...hours.map((h) => h.count), 1)

  // Show only hours with new reviews
  const displayHours = React.useMemo(() => {
    const totalCount = hours.reduce((sum, hour) => sum + hour.count, 0)

    // If no reviews at all in next 12 hours, show a message
    if (totalCount === 0) {
      return []
    }

    return hours.filter((hour) => hour.count > 0)
  }, [hours])

  const totalUpcoming = hours.reduce((sum, hour) => sum + hour.count, 0)

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-lg">Upcoming Reviews</CardTitle>
      </CardHeader>
      <CardContent className="gap-3">
        {displayHours.length === 0 ? (
          <Muted>No reviews in the next 12 hours</Muted>
        ) : (
          <>
            {displayHours.map((hour, index) => (
              <View key={hour.label} className="flex-row items-center gap-3">
                <Text
                  className="w-12 text-sm"
                  numberOfLines={1}
                  style={{ color: colors.mutedForeground }}
                >
                  {hour.label}
                </Text>
                <View className="flex-1 h-5 rounded-full overflow-hidden" style={{ backgroundColor: colors.muted }}>
                  <View
                    className="h-full rounded-full"
                    style={{
                      width: `${(hour.count / maxCount) * 100}%`,
                      backgroundColor: colors.primary,
                    }}
                  />
                </View>
                <Text className="w-10 text-sm font-medium text-right">
                    {`+${hour.count}`}
                  </Text>
                </View>
            ))}
            <Muted className="mt-1">
              {totalUpcoming} new reviews in the next 12 hours
            </Muted>
          </>
        )}
      </CardContent>
    </Card>
  )
}
