import * as React from "react"
import { useDatabase } from "@/db/provider"
import {
  getAvailableReviewCount,
  getAvailableLessonCount,
  getSrsBreakdown,
  getLevelProgress,
  getDetailedLevelProgress,
  getReviewForecast,
  getWeeklyForecast,
  getCurrentUser,
} from "@/db/queries"
import { triggerFullRefreshSync } from "@/lib/sync/background-sync"
import { useAuthStore } from "@/stores/auth"
import { useSettingsStore } from "@/stores/settings"
import { useBackgroundSyncStore } from "@/stores/background-sync"

export interface DashboardData {
  /** Number of reviews available now */
  reviewCount: number
  /** Number of lessons available */
  lessonCount: number
  /** SRS stage breakdown */
  srsBreakdown: {
    apprentice: number
    guru: number
    master: number
    enlightened: number
    burned: number
  }
  /** Current level progress */
  levelProgress: {
    level: number
    total: number
    passed: number
    percentage: number
  }
  /** Detailed level breakdown */
  levelDetail: {
    radicals: { total: number; passed: number; lessons: number; inProgress: number }
    kanji: { total: number; passed: number; lessons: number; inProgress: number }
    vocabulary: { total: number; passed: number; lessons: number; inProgress: number }
  }
  /** Review forecast for next 24 hours */
  forecast: Array<{ hour: number; count: number }>
  /** Weekly forecast for next 7 days */
  weeklyForecast: Array<{ day: string; date: string; count: number }>
  /** User info */
  user: {
    username: string
    level: number
    vacationStartedAt: number | null
  } | null
}

const initialData: DashboardData = {
  reviewCount: 0,
  lessonCount: 0,
  srsBreakdown: {
    apprentice: 0,
    guru: 0,
    master: 0,
    enlightened: 0,
    burned: 0,
  },
  levelProgress: {
    level: 1,
    total: 0,
    passed: 0,
    percentage: 0,
  },
  levelDetail: {
    radicals: { total: 0, passed: 0, lessons: 0, inProgress: 0 },
    kanji: { total: 0, passed: 0, lessons: 0, inProgress: 0 },
    vocabulary: { total: 0, passed: 0, lessons: 0, inProgress: 0 },
  },
  forecast: [],
  weeklyForecast: [],
  user: null,
}

export function useDashboardData() {
  const { db } = useDatabase()
  const hideKanaVocabulary = useSettingsStore((s) => s.hideKanaVocabulary)
  const [data, setData] = React.useState<DashboardData>(initialData)
  const [isLoading, setIsLoading] = React.useState(true)
  const [isRefreshing, setIsRefreshing] = React.useState(false)
  const [error, setError] = React.useState<string | null>(null)

  const fetchData = React.useCallback(async (isRefresh = false) => {
    if (!db) return

    if (isRefresh) {
      setIsRefreshing(true)
    } else {
      setIsLoading(true)
    }
    setError(null)

    try {
      // Fetch all data in parallel
      const [
        reviewCount,
        lessonCount,
        srsBreakdown,
        user,
        forecast,
      ] = await Promise.all([
        getAvailableReviewCount(db),
        getAvailableLessonCount(db, hideKanaVocabulary),
        getSrsBreakdown(db),
        getCurrentUser(db),
        getReviewForecast(db, 24),
      ])

      // Get level progress based on user's current level
      const level = user?.level ?? 1
      const [levelProgress, levelDetail, weeklyForecast] = await Promise.all([
        getLevelProgress(db, level),
        getDetailedLevelProgress(db, level, hideKanaVocabulary),
        getWeeklyForecast(db),
      ])

      setData({
        reviewCount,
        lessonCount,
        srsBreakdown,
        levelProgress: {
          level,
          ...levelProgress,
        },
        levelDetail,
        forecast,
        weeklyForecast,
        user: user ? { 
          username: user.username, 
          level: user.level,
          vacationStartedAt: user.vacationStartedAt,
        } : null,
      })
    } catch (err) {
      console.error("[useDashboardData] Error fetching data:", err)
      setError(err instanceof Error ? err.message : "Failed to load dashboard data")
    } finally {
      setIsLoading(false)
      setIsRefreshing(false)
    }
  }, [db, hideKanaVocabulary])

  // Initial fetch
  React.useEffect(() => {
    fetchData()
  }, [fetchData])

  // Auto-refetch when sync completes
  // This ensures dashboard always shows latest data after any sync
  const isSyncing = useBackgroundSyncStore((s) => s.isSyncing)
  const prevSyncingRef = React.useRef(isSyncing)

  React.useEffect(() => {
    // Detect sync completion (was syncing, now not syncing)
    if (prevSyncingRef.current && !isSyncing) {
      console.log("[useDashboardData] Sync completed, refreshing dashboard data...")
      fetchData()
    }
    prevSyncingRef.current = isSyncing
  }, [isSyncing, fetchData])

  const refetch = React.useCallback(async () => {
    // On pull-to-refresh, trigger full sync via background sync manager
    // The sync manager handles online check, auth, and progress tracking
    const authStatus = useAuthStore.getState().status

    if (authStatus === "authenticated") {
      console.log("[useDashboardData] Pull-to-refresh, triggering full sync...")
      // This is async but we don't await it - the sync runs in background
      // and the auto-refetch effect above will refresh data when it completes
      triggerFullRefreshSync()
    }

    // Also do immediate local data refresh
    return fetchData(true)
  }, [fetchData])

  return {
    ...data,
    isLoading,
    isRefreshing,
    error,
    refetch,
  }
}
