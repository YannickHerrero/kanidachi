import * as React from "react"
import { View, Pressable } from "react-native"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Text } from "@/components/ui/text"
import { Muted } from "@/components/ui/typography"

interface WeeklyForecastProps {
  /** Daily forecast data for the next 7 days */
  dailyForecast: Array<{ day: string; date: string; count: number }>
}

const DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"]

export function WeeklyForecast({ dailyForecast }: WeeklyForecastProps) {
  const maxCount = Math.max(...dailyForecast.map((d) => d.count), 1)
  const totalWeek = dailyForecast.reduce((sum, d) => sum + d.count, 0)

  // Find today's day name
  const today = DAYS[new Date().getDay()]

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-lg">7-Day Forecast</CardTitle>
      </CardHeader>
      <CardContent className="gap-3 pt-4">
        {dailyForecast.length === 0 ? (
          <Muted>No upcoming reviews</Muted>
        ) : (
          <>
            {/* Bar chart */}
            <View className="flex-row items-end justify-between h-24 gap-1">
              {dailyForecast.map((day, index) => {
                const height = day.count > 0 ? Math.max((day.count / maxCount) * 100, 8) : 4
                const isToday = index === 0
                return (
                  <View key={day.day} className="flex-1 items-center gap-1">
                    <View
                      className={`w-full rounded-t ${isToday ? "bg-primary" : "bg-muted-foreground/30"}`}
                      style={{ height: `${height}%` }}
                    />
                    <Text
                      className={`text-xs ${isToday ? "font-semibold text-primary" : "text-muted-foreground"}`}
                    >
                      {day.day}
                    </Text>
                  </View>
                )
              })}
            </View>

            {/* Legend */}
            <View className="flex-row flex-wrap gap-3 pt-2 border-t border-border">
              {dailyForecast.slice(0, 4).map((day, index) => (
                <View key={day.day} className="flex-row items-center gap-1">
                  <Text className="text-xs text-muted-foreground">{day.date}:</Text>
                  <Text className="text-xs font-medium">{day.count}</Text>
                </View>
              ))}
            </View>

            <Muted>
              {totalWeek} reviews in the next 7 days
            </Muted>
          </>
        )}
      </CardContent>
    </Card>
  )
}
