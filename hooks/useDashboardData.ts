import * as React from "react"
import { useDatabase } from "@/db/provider"
import {
  getAvailableReviewCount,
  getAvailableLessonCount,
  getSrsBreakdown,
  getLevelProgress,
  getReviewForecast,
  getCurrentUser,
} from "@/db/queries"
import { performFullRefreshSync } from "@/lib/sync/incremental-sync"
import { checkIsOnline } from "@/hooks/useNetworkStatus"
import { useAuthStore } from "@/stores/auth"

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
  /** Review forecast for next 24 hours */
  forecast: Array<{ hour: number; count: number }>
  /** User info */
  user: {
    username: string
    level: number
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
  forecast: [],
  user: null,
}

export function useDashboardData() {
  const { db } = useDatabase()
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
        getAvailableLessonCount(db),
        getSrsBreakdown(db),
        getCurrentUser(db),
        getReviewForecast(db, 24),
      ])

      // Get level progress based on user's current level
      const level = user?.level ?? 1
      const levelProgress = await getLevelProgress(db, level)

      setData({
        reviewCount,
        lessonCount,
        srsBreakdown,
        levelProgress: {
          level,
          ...levelProgress,
        },
        forecast,
        user: user ? { username: user.username, level: user.level } : null,
      })
    } catch (err) {
      console.error("[useDashboardData] Error fetching data:", err)
      setError(err instanceof Error ? err.message : "Failed to load dashboard data")
    } finally {
      setIsLoading(false)
      setIsRefreshing(false)
    }
  }, [db])

  // Initial fetch
  React.useEffect(() => {
    fetchData()
  }, [fetchData])

  const refetch = React.useCallback(async () => {
    // On pull-to-refresh, do a full sync to get latest from server
    const isOnline = await checkIsOnline()
    const authStatus = useAuthStore.getState().status

    if (isOnline && authStatus === "authenticated" && db) {
      try {
        console.log("[useDashboardData] Pull-to-refresh, triggering full sync...")
        await performFullRefreshSync(db)
      } catch (error) {
        console.error("[useDashboardData] Full sync failed:", error)
        // Continue with local data refresh even if sync fails
      }
    }

    // Then refresh local data
    return fetchData(true)
  }, [fetchData, db])

  return {
    ...data,
    isLoading,
    isRefreshing,
    error,
    refetch,
  }
}
