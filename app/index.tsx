import * as React from "react"
import { RefreshControl, ScrollView, View } from "react-native"
import { SafeAreaView } from "react-native-safe-area-context"
import { useRouter } from "expo-router"
import { Settings } from "lucide-react-native"

import { Button } from "@/components/ui/button"
import { Text } from "@/components/ui/text"
import { H1, Muted } from "@/components/ui/typography"
import { Skeleton } from "@/components/ui/skeleton"
import { ReviewCard } from "@/components/dashboard/review-card"
import { LessonCard } from "@/components/dashboard/lesson-card"
import { LevelProgress } from "@/components/dashboard/level-progress"
import { SrsBreakdown } from "@/components/dashboard/srs-breakdown"
import { ForecastChart } from "@/components/dashboard/forecast-chart"
import { BrowseCard } from "@/components/dashboard/browse-card"
import { StatsCard } from "@/components/dashboard/stats-card"
import { useDashboardData } from "@/hooks/useDashboardData"
import { useColorScheme } from "@/lib/useColorScheme"

export default function Dashboard() {
  const router = useRouter()
  const { colorScheme } = useColorScheme()
  const {
    reviewCount,
    lessonCount,
    srsBreakdown,
    levelProgress,
    forecast,
    user,
    isLoading,
    isRefreshing,
    error,
    refetch,
  } = useDashboardData()

  const handleSettingsPress = () => {
    router.push("/settings")
  }

  if (isLoading) {
    return (
      <SafeAreaView className="flex-1 bg-background">
        <View className="flex-1 p-4 gap-4">
          {/* Header skeleton */}
          <View className="flex-row items-center justify-between mb-2">
            <View className="gap-1">
              <Skeleton className="h-8 w-40" />
              <Skeleton className="h-4 w-24" />
            </View>
            <Skeleton className="h-10 w-10 rounded-full" />
          </View>

          {/* Cards skeleton */}
          <View className="flex-row gap-4">
            <Skeleton className="flex-1 h-32" />
            <Skeleton className="flex-1 h-32" />
          </View>

          {/* Progress skeleton */}
          <Skeleton className="h-28" />
          <Skeleton className="h-44" />
          <Skeleton className="h-56" />
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
        <View className="flex-row items-center justify-between mb-2">
          <View>
            <H1 className="text-2xl">
              {user ? `Hi, ${user.username}` : "Dashboard"}
            </H1>
            {user && (
              <Muted>Level {user.level}</Muted>
            )}
          </View>
          <Button
            variant="ghost"
            size="icon"
            onPress={handleSettingsPress}
            className="rounded-full"
          >
            <Settings
              size={24}
              color={colorScheme === "dark" ? "#a1a1aa" : "#71717a"}
            />
          </Button>
        </View>

        {/* Review & Lesson Cards */}
        <View className="flex-row gap-4">
          <ReviewCard count={reviewCount} />
          <LessonCard count={lessonCount} />
        </View>

        {/* Browse Card */}
        <BrowseCard />

        {/* Stats Card */}
        <StatsCard />

        {/* Level Progress */}
        <LevelProgress
          level={levelProgress.level}
          total={levelProgress.total}
          passed={levelProgress.passed}
          percentage={levelProgress.percentage}
        />

        {/* SRS Breakdown */}
        <SrsBreakdown
          apprentice={srsBreakdown.apprentice}
          guru={srsBreakdown.guru}
          master={srsBreakdown.master}
          enlightened={srsBreakdown.enlightened}
          burned={srsBreakdown.burned}
        />

        {/* Review Forecast */}
        <ForecastChart forecast={forecast} currentReviews={reviewCount} />

        {/* Bottom padding for safe area */}
        <View className="h-4" />
      </ScrollView>
    </SafeAreaView>
  )
}
