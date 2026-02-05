import * as React from "react"
import { ScrollView, View } from "react-native"
import { SafeAreaView } from "react-native-safe-area-context"
import { useRouter } from "expo-router"
import { ChevronLeft } from "lucide-react-native"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { Text } from "@/components/ui/text"
import { H1, Muted } from "@/components/ui/typography"
import { useThemeColors } from "@/hooks/useThemeColors"
import { useDatabase } from "@/db/provider"
import { getStudyDayDetails, type StudyDayDetail } from "@/db/queries"
import { useSettingsStore } from "@/stores/settings"
import { getLocalDateKeysForPastDays } from "@/lib/date-utils"
import type { ThemeColors } from "@/lib/colors"

function formatDateLabel(dateKey: string): string {
  const [year, month, day] = dateKey.split("-").map(Number)
  if (!year || !month || !day) return dateKey
  const date = new Date(year, month - 1, day)
  const now = new Date()
  const includeYear = date.getFullYear() !== now.getFullYear()
  return date.toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    ...(includeYear ? { year: "numeric" } : {}),
  })
}

function formatDuration(seconds: number): string {
  const minutes = Math.floor(seconds / 60)
  if (minutes < 1) return `${seconds}s`
  const hours = Math.floor(minutes / 60)
  const remainder = minutes % 60
  if (hours > 0) return `${hours}h ${remainder}m`
  return `${minutes}m`
}

function withAlpha(hex: string, alpha: number): string {
  const normalized = hex.replace("#", "")
  const full = normalized.length === 3
    ? normalized.split("").map((char) => char + char).join("")
    : normalized
  if (full.length !== 6) return hex
  const r = Number.parseInt(full.slice(0, 2), 16)
  const g = Number.parseInt(full.slice(2, 4), 16)
  const b = Number.parseInt(full.slice(4, 6), 16)
  return `rgba(${r}, ${g}, ${b}, ${alpha})`
}

function getCardVariantStyles(colors: ThemeColors) {
  return {
    containerStyle: {
      borderColor: withAlpha(colors.primary, 0.2),
      backgroundColor: withAlpha(colors.primary, 0.06),
    },
    chipStyle: {
      borderColor: withAlpha(colors.primary, 0.25),
      backgroundColor: withAlpha(colors.primary, 0.12),
    },
  }
}

export default function StatsStudyDetailsScreen() {
  const router = useRouter()
  const colors = useThemeColors()
  const { db } = useDatabase()
  const hideKanaVocabulary = useSettingsStore((s) => s.hideKanaVocabulary)
  const [details, setDetails] = React.useState<StudyDayDetail[]>([])
  const [isLoading, setIsLoading] = React.useState(true)
  const [error, setError] = React.useState<string | null>(null)

  const fetchDetails = React.useCallback(async () => {
    if (!db) return
    setIsLoading(true)
    setError(null)

    try {
      const dateKeys = getLocalDateKeysForPastDays(30)
      const data = await getStudyDayDetails(db, dateKeys, hideKanaVocabulary)
      const filtered = data.filter((entry) => {
        const totalSeconds =
          entry.reviewsSeconds + entry.lessonsSeconds + entry.lessonsQuizSeconds
        const totalNew = entry.newRadicals + entry.newKanji + entry.newVocabulary
        return totalSeconds > 0 || totalNew > 0
      }).sort((a, b) => b.date.localeCompare(a.date))
      setDetails(filtered)
    } catch (err) {
      console.error("[StatsStudyDetails] Error fetching data:", err)
      setError(err instanceof Error ? err.message : "Failed to load study details")
    } finally {
      setIsLoading(false)
    }
  }, [db, hideKanaVocabulary])

  React.useEffect(() => {
    fetchDetails()
  }, [fetchDetails])

  const handleBack = () => {
    router.back()
  }

  if (isLoading) {
    return (
      <SafeAreaView className="flex-1" style={{ backgroundColor: colors.background }}>
        <View className="flex-1 p-4 gap-4">
          <View className="flex-row items-center gap-3 mb-2">
            <Skeleton className="h-10 w-10 rounded-full" />
            <Skeleton className="h-8 w-48" />
          </View>
          <View className="flex-row flex-wrap gap-3">
            <Skeleton className="h-40 w-[48%]" />
            <Skeleton className="h-40 w-[48%]" />
            <Skeleton className="h-40 w-[48%]" />
            <Skeleton className="h-40 w-[48%]" />
          </View>
        </View>
      </SafeAreaView>
    )
  }

  if (error) {
    return (
      <SafeAreaView className="flex-1" style={{ backgroundColor: colors.background }}>
        <View className="flex-1 items-center justify-center p-4 gap-4">
          <Text className="text-center" style={{ color: colors.destructive }}>{error}</Text>
          <Button onPress={fetchDetails}>
            <Text>Try Again</Text>
          </Button>
        </View>
      </SafeAreaView>
    )
  }

  return (
    <SafeAreaView className="flex-1" style={{ backgroundColor: colors.background }} edges={["top"]}>
      <ScrollView
        className="flex-1"
        contentContainerClassName="p-4 gap-4"
        showsVerticalScrollIndicator={false}
      >
        <View className="flex-row items-center gap-3 mb-2">
          <Button
            variant="ghost"
            size="icon"
            onPress={handleBack}
            className="rounded-full"
          >
            <ChevronLeft size={24} color={colors.foreground} />
          </Button>
          <H1 className="text-2xl">Study Details</H1>
        </View>

        {details.length === 0 ? (
          <View className="items-center py-12">
            <Muted className="text-center">
              No study activity found in the last 30 days.
            </Muted>
          </View>
        ) : (
          <View className="flex-row flex-wrap gap-3">
            {details.map((entry) => {
              const totalSeconds =
                entry.reviewsSeconds + entry.lessonsSeconds + entry.lessonsQuizSeconds
              const totalNew = entry.newRadicals + entry.newKanji + entry.newVocabulary
              const variantStyles = getCardVariantStyles(colors)

              return (
                <View key={entry.date} style={{ width: "48%", minWidth: 160, flexGrow: 1 }}>
                  <Card style={variantStyles.containerStyle}>
                    <CardHeader className="pb-3">
                      <View className="flex-row items-start justify-between gap-2">
                        <View className="flex-1">
                          <CardTitle className="text-base">
                            {formatDateLabel(entry.date)}
                          </CardTitle>
                          <Muted className="text-xs">{totalNew} new cards</Muted>
                        </View>
                        <View
                          className="px-2 py-1 rounded-full border"
                          style={variantStyles.chipStyle}
                        >
                          <Text className="text-[10px]" style={{ color: colors.foreground }}>
                            {formatDuration(totalSeconds)}
                          </Text>
                        </View>
                      </View>
                    </CardHeader>
                    <CardContent className="gap-3">
                      <View className="gap-2">
                        <Muted className="text-xs">New cards</Muted>
                        <View className="flex-row flex-wrap gap-2">
                          <View
                            className="px-2 py-1 rounded-full border"
                            style={variantStyles.chipStyle}
                          >
                            <Text className="text-[10px]" style={{ color: colors.foreground }}>
                              Radicals {entry.newRadicals}
                            </Text>
                          </View>
                          <View
                            className="px-2 py-1 rounded-full border"
                            style={variantStyles.chipStyle}
                          >
                            <Text className="text-[10px]" style={{ color: colors.foreground }}>
                              Kanji {entry.newKanji}
                            </Text>
                          </View>
                          <View
                            className="px-2 py-1 rounded-full border"
                            style={variantStyles.chipStyle}
                          >
                            <Text className="text-[10px]" style={{ color: colors.foreground }}>
                              Vocab {entry.newVocabulary}
                            </Text>
                          </View>
                        </View>
                      </View>
                      <View
                        className="gap-2"
                      >
                        <Muted className="text-xs">Time spent</Muted>
                        <View className="gap-1">
                          <View className="flex-row items-center justify-between">
                            <Muted className="text-xs">Lessons</Muted>
                            <Text className="text-xs" style={{ color: colors.foreground }}>
                              {formatDuration(entry.lessonsSeconds)}
                            </Text>
                          </View>
                          <View className="flex-row items-center justify-between">
                            <Muted className="text-xs">Lesson quiz</Muted>
                            <Text className="text-xs" style={{ color: colors.foreground }}>
                              {formatDuration(entry.lessonsQuizSeconds)}
                            </Text>
                          </View>
                          <View className="flex-row items-center justify-between">
                            <Muted className="text-xs">Reviews</Muted>
                            <Text className="text-xs" style={{ color: colors.foreground }}>
                              {formatDuration(entry.reviewsSeconds)}
                            </Text>
                          </View>
                        </View>
                      </View>
                    </CardContent>
                  </Card>
                </View>
              )
            })}
          </View>
        )}

        <View className="h-4" />
      </ScrollView>
    </SafeAreaView>
  )
}
