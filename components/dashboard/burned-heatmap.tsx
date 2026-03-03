import * as React from "react"
import { Pressable, ScrollView, StyleSheet, View } from "react-native"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Text } from "@/components/ui/text"
import { useThemeColors } from "@/hooks/useThemeColors"
import { getLocalDateKey } from "@/lib/date-utils"

export interface BurnedHeatmapDay {
  date: string
  burnedCount: number
}

interface BurnedHeatmapProps {
  days: BurnedHeatmapDay[]
}

interface HeatmapDay {
  date: string
  burnedCount: number
  dateObject: Date
}

interface HeatmapColumn {
  days: HeatmapDay[]
  monthLabel: string | null
}

function parseDateKey(dateKey: string): Date | null {
  const [year, month, day] = dateKey.split("-").map(Number)
  if (!year || !month || !day) return null
  return new Date(year, month - 1, day)
}

function getMonthLabel(date: Date): string {
  return date.toLocaleString("en-US", { month: "short" })
}

function withOpacity(color: string, alpha: number): string {
  if (!color.startsWith("#")) return color
  const hex = color.replace("#", "")
  if (hex.length !== 6) return color
  const r = Number.parseInt(hex.slice(0, 2), 16)
  const g = Number.parseInt(hex.slice(2, 4), 16)
  const b = Number.parseInt(hex.slice(4, 6), 16)
  return `rgba(${r}, ${g}, ${b}, ${alpha})`
}

export function BurnedHeatmap({ days }: BurnedHeatmapProps) {
  const colors = useThemeColors()
  const scrollRef = React.useRef<ScrollView | null>(null)
  const [activeDay, setActiveDay] = React.useState<BurnedHeatmapDay | null>(null)

  const { columns, maxCount } = React.useMemo(() => {
    if (days.length === 0) {
      return { columns: [] as HeatmapColumn[], maxCount: 0 }
    }

    const counts = new Map(days.map((day) => [day.date, day.burnedCount]))
    const firstDate = parseDateKey(days[0].date)
    const lastDate = parseDateKey(days[days.length - 1].date)

    if (!firstDate || !lastDate) {
      return { columns: [] as HeatmapColumn[], maxCount: 0 }
    }

    const start = new Date(firstDate)
    start.setDate(start.getDate() - start.getDay())
    const end = new Date(lastDate)
    end.setDate(end.getDate() + (6 - end.getDay()))

    const allDays: HeatmapDay[] = []
    const cursor = new Date(start)
    while (cursor <= end) {
      const dateKey = getLocalDateKey(cursor)
      allDays.push({
        date: dateKey,
        burnedCount: counts.get(dateKey) ?? 0,
        dateObject: new Date(cursor),
      })
      cursor.setDate(cursor.getDate() + 1)
    }

    const columns: HeatmapColumn[] = []
    for (let i = 0; i < allDays.length; i += 7) {
      const weekDays = allDays.slice(i, i + 7)
      let monthLabel: string | null = null
      for (const day of weekDays) {
        if (day.dateObject.getDate() === 1) {
          monthLabel = getMonthLabel(day.dateObject)
          break
        }
      }
      columns.push({ days: weekDays, monthLabel })
    }

    const maxCount = Math.max(...days.map((day) => day.burnedCount), 0)
    return { columns, maxCount }
  }, [days])

  React.useEffect(() => {
    if (activeDay || days.length === 0) return
    setActiveDay(days[days.length - 1])
  }, [activeDay, days])

  const getColor = React.useCallback(
    (count: number) => {
      if (count <= 0 || maxCount <= 0) return colors.border
      const ratio = count / maxCount
      if (ratio <= 0.25) return withOpacity(colors.primary, 0.25)
      if (ratio <= 0.5) return withOpacity(colors.primary, 0.45)
      if (ratio <= 0.75) return withOpacity(colors.primary, 0.65)
      return withOpacity(colors.primary, 0.85)
    },
    [colors.border, colors.primary, maxCount]
  )

  const hasData = maxCount > 0

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-lg">Burned Items Heatmap</CardTitle>
      </CardHeader>
      <CardContent className="gap-4">
        <View className="flex-row items-center justify-between">
          <Text className="text-xs" style={{ color: colors.mutedForeground }}>
            Last 12 months
          </Text>
          <View className="flex-row items-center gap-2">
            <Text className="text-[10px]" style={{ color: colors.mutedForeground }}>
              Less
            </Text>
            <View style={[styles.legendSwatch, { backgroundColor: colors.border }]} />
            <View style={[styles.legendSwatch, { backgroundColor: withOpacity(colors.primary, 0.25) }]} />
            <View style={[styles.legendSwatch, { backgroundColor: withOpacity(colors.primary, 0.45) }]} />
            <View style={[styles.legendSwatch, { backgroundColor: withOpacity(colors.primary, 0.65) }]} />
            <View style={[styles.legendSwatch, { backgroundColor: withOpacity(colors.primary, 0.85) }]} />
            <Text className="text-[10px]" style={{ color: colors.mutedForeground }}>
              More
            </Text>
          </View>
        </View>

        {columns.length > 0 ? (
          <ScrollView
            ref={scrollRef}
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.scrollContainer}
            onContentSizeChange={() => {
              scrollRef.current?.scrollToEnd({ animated: false })
            }}
          >
            <View style={styles.monthRow}>
              {columns.map((column, index) => (
                <View key={`label-${index}`} style={styles.monthCell}>
                  <Text className="text-[10px]" style={{ color: colors.mutedForeground }}>
                    {column.monthLabel ?? ""}
                  </Text>
                </View>
              ))}
            </View>
            <View style={styles.grid}>
              {columns.map((column, index) => (
                <View key={`col-${index}`} style={styles.column}>
                  {column.days.map((day) => (
                    <Pressable
                      key={day.date}
                      style={[
                        styles.cell,
                        {
                          backgroundColor: getColor(day.burnedCount),
                          borderColor: colors.border,
                        },
                      ]}
                      onPress={() => {
                        setActiveDay({ date: day.date, burnedCount: day.burnedCount })
                      }}
                      onHoverIn={() => {
                        setActiveDay({ date: day.date, burnedCount: day.burnedCount })
                      }}
                      accessibilityRole="button"
                      accessibilityLabel={`Burned items on ${day.date}: ${day.burnedCount}`}
                    />
                  ))}
                </View>
              ))}
            </View>
          </ScrollView>
        ) : (
          <View className="items-center py-4">
            <Text className="text-sm text-center" style={{ color: colors.mutedForeground }}>
              No burned items yet. Keep studying to build your burn history.
            </Text>
          </View>
        )}

        {activeDay && (
          <View className="flex-row items-center gap-3 pt-2 border-t" style={{ borderColor: colors.border }}>
            <Text className="text-xs" style={{ color: colors.mutedForeground }}>
              {activeDay.date}
            </Text>
            <Text className="text-xs" style={{ color: colors.foreground }}>
              {activeDay.burnedCount} burned
            </Text>
            {!hasData && (
              <Text className="text-xs" style={{ color: colors.mutedForeground }}>
                Keep studying to see intensity
              </Text>
            )}
          </View>
        )}
      </CardContent>
    </Card>
  )
}

const styles = StyleSheet.create({
  scrollContainer: {
    paddingBottom: 4,
  },
  monthRow: {
    flexDirection: "row",
    marginBottom: 6,
  },
  monthCell: {
    width: 12,
    marginRight: 4,
    alignItems: "flex-start",
  },
  grid: {
    flexDirection: "row",
  },
  column: {
    flexDirection: "column",
    gap: 4,
    marginRight: 4,
  },
  cell: {
    width: 12,
    height: 12,
    borderRadius: 3,
    borderWidth: 1,
  },
  legendSwatch: {
    width: 10,
    height: 10,
    borderRadius: 2,
  },
})
