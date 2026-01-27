import * as React from "react"
import { RefreshControl, ScrollView, View } from "react-native"
import { SafeAreaView } from "react-native-safe-area-context"
import { useRouter } from "expo-router"
import { ChevronLeft } from "lucide-react-native"

import { Button } from "@/components/ui/button"
import { Text } from "@/components/ui/text"
import { H1, Muted } from "@/components/ui/typography"
import { Skeleton } from "@/components/ui/skeleton"
import { AccuracyChart } from "@/components/stats/accuracy-chart"
import { LevelTimeChart } from "@/components/stats/level-time-chart"
import { LevelTimeline } from "@/components/stats/level-timeline"
import { LeechList } from "@/components/stats/leech-list"
import { useStatistics } from "@/hooks/useStatistics"
import { useColorScheme } from "@/lib/useColorScheme"
import { getCurrentUser } from "@/db/queries"
import { useDatabase } from "@/db/provider"

export default function StatsScreen() {
  const router = useRouter()
  const { colorScheme } = useColorScheme()
  const { db } = useDatabase()
  const [currentLevel, setCurrentLevel] = React.useState(1)
  const {
    overallAccuracy,
    accuracyByType,
    leeches,
    levelTimeline,
    totalStats,
    srsBreakdown,
    isLoading,
    isRefreshing,
    error,
    refetch,
  } = useStatistics()

  // Get current user level
  React.useEffect(() => {
    async function fetchUserLevel() {
      if (!db) return
      const user = await getCurrentUser(db)
      if (user) {
        setCurrentLevel(user.level)
      }
    }
    fetchUserLevel()
  }, [db])

  const handleBack = () => {
    router.back()
  }

  if (isLoading) {
    return (
      <SafeAreaView className="flex-1 bg-background">
        <View className="flex-1 p-4 gap-4">
          {/* Header skeleton */}
          <View className="flex-row items-center gap-3 mb-2">
            <Skeleton className="h-10 w-10 rounded-full" />
            <Skeleton className="h-8 w-32" />
          </View>

          {/* Charts skeleton */}
          <Skeleton className="h-72" />
          <Skeleton className="h-64" />
          <Skeleton className="h-48" />
        </View>
      </SafeAreaView>
    )
  }

  if (error) {
    return (
      <SafeAreaView className="flex-1 bg-background">
        <View className="flex-1 items-center justify-center p-4 gap-4">
          <Text className="text-destructive text-center">{error}</Text>
          <Button onPress={refetch}>
            <Text>Try Again</Text>
          </Button>
        </View>
      </SafeAreaView>
    )
  }

  // Calculate total items in SRS
  const totalInSrs =
    srsBreakdown.apprentice +
    srsBreakdown.guru +
    srsBreakdown.master +
    srsBreakdown.enlightened +
    srsBreakdown.burned

  return (
    <SafeAreaView className="flex-1 bg-background" edges={["top"]}>
      <ScrollView
        className="flex-1"
        contentContainerClassName="p-4 gap-4"
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={isRefreshing} onRefresh={refetch} />
        }
      >
        {/* Header */}
        <View className="flex-row items-center gap-3 mb-2">
          <Button
            variant="ghost"
            size="icon"
            onPress={handleBack}
            className="rounded-full"
          >
            <ChevronLeft
              size={24}
              color={colorScheme === "dark" ? "#ffffff" : "#000000"}
            />
          </Button>
          <H1 className="text-2xl">Statistics</H1>
        </View>

        {/* Summary row */}
        <View className="flex-row flex-wrap gap-2 mb-2">
          <View className="flex-1 min-w-[100px] bg-card rounded-lg p-3 border border-border">
            <Text className="text-2xl font-bold text-foreground">
              {totalStats.totalLessons.toLocaleString()}
            </Text>
            <Muted className="text-xs">Items Studied</Muted>
          </View>
          <View className="flex-1 min-w-[100px] bg-card rounded-lg p-3 border border-border">
            <Text className="text-2xl font-bold text-foreground">
              {totalStats.totalReviews.toLocaleString()}
            </Text>
            <Muted className="text-xs">Total Answers</Muted>
          </View>
          <View className="flex-1 min-w-[100px] bg-card rounded-lg p-3 border border-border">
            <Text className="text-2xl font-bold text-foreground">
              {srsBreakdown.burned.toLocaleString()}
            </Text>
            <Muted className="text-xs">Burned</Muted>
          </View>
        </View>

        {/* Accuracy Chart */}
        <AccuracyChart
          overallAccuracy={overallAccuracy}
          accuracyByType={accuracyByType}
          totalReviews={totalStats.totalReviews}
        />

        {/* Time per Level */}
        <LevelTimeChart levelTimeline={levelTimeline} currentLevel={currentLevel} />

        {/* Level Timeline */}
        <LevelTimeline levelTimeline={levelTimeline} currentLevel={currentLevel} />

        {/* Leech List */}
        <LeechList leeches={leeches} maxItems={15} />

        {/* Bottom padding for safe area */}
        <View className="h-4" />
      </ScrollView>
    </SafeAreaView>
  )
}
