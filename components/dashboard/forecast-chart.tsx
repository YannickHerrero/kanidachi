import * as React from "react"
import { View } from "react-native"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Text } from "@/components/ui/text"
import { Muted } from "@/components/ui/typography"

interface ForecastChartProps {
  /** Array of { hour: number, count: number } for next 24 hours */
  forecast: Array<{ hour: number; count: number }>
  /** Number of reviews available now */
  currentReviews: number
}

export function ForecastChart({ forecast, currentReviews }: ForecastChartProps) {
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
    const slots: Array<{ label: string; count: number; cumulative: number }> = []
    let cumulative = currentReviews

    for (let h = 0; h < 12; h++) {
      const count = forecastMap.get(h) ?? 0
      cumulative += count

      const label = h === 0 ? "Now" : `+${h}h`
      slots.push({ label, count: h === 0 ? currentReviews : count, cumulative })
    }

    return slots
  }, [forecast, currentReviews])

  // Find max for scaling
  const maxCount = Math.max(...hours.map((h) => h.cumulative), 1)

  // Filter to only show hours with reviews or significant time markers
  const displayHours = React.useMemo(() => {
    // Always show "Now" if there are current reviews
    // Then show hours that have new reviews coming
    const result: typeof hours = []

    for (let i = 0; i < hours.length; i++) {
      const hour = hours[i]
      // Show if: it's "Now", or there are reviews at this hour, or it's every 3rd hour
      if (i === 0 || hour.count > 0 || i % 3 === 0) {
        result.push(hour)
      }
    }

    // If no reviews at all in next 12 hours, show a message
    if (result.length === 1 && result[0].cumulative === 0) {
      return []
    }

    return result.slice(0, 8) // Max 8 rows to keep it compact
  }, [hours])

  const totalUpcoming = hours[hours.length - 1]?.cumulative ?? 0

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
                <Text className="w-10 text-sm text-muted-foreground">{hour.label}</Text>
                <View className="flex-1 h-5 bg-muted rounded-full overflow-hidden">
                  <View
                    className="h-full bg-primary rounded-full"
                    style={{
                      width: `${(hour.cumulative / maxCount) * 100}%`,
                    }}
                  />
                </View>
                <Text className="w-10 text-sm font-medium text-right">
                  {hour.cumulative}
                </Text>
              </View>
            ))}
            <Muted className="mt-1">
              {totalUpcoming} reviews in the next 12 hours
            </Muted>
          </>
        )}
      </CardContent>
    </Card>
  )
}
