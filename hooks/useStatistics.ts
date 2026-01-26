import * as React from "react"
import { useDatabase } from "@/db/provider"
import {
  getOverallAccuracy,
  getAccuracyByType,
  getLeeches,
  getLevelTimeline,
  getTotalReviewStats,
  getSrsBreakdown,
} from "@/db/queries"
import type { subjects } from "@/db/schema"

export interface AccuracyStats {
  totalCorrect: number
  totalIncorrect: number
  percentage: number
}

export interface AccuracyByType {
  subjectType: string
  totalCorrect: number
  totalIncorrect: number
  percentage: number
  subjectCount: number
}

export interface Leech {
  subjectId: number
  subjectType: string
  percentageCorrect: number
  meaningCorrect: number
  meaningIncorrect: number
  readingCorrect: number
  readingIncorrect: number
  subject: typeof subjects.$inferSelect
}

export interface LevelProgressionData {
  level: number
  unlockedAt: number | null
  startedAt: number | null
  passedAt: number | null
  completedAt: number | null
  abandonedAt: number | null
  timeSpentDays: number | null
}

export interface SrsBreakdown {
  apprentice: number
  guru: number
  master: number
  enlightened: number
  burned: number
}

export interface StatisticsData {
  /** Overall accuracy percentage */
  overallAccuracy: AccuracyStats
  /** Accuracy breakdown by subject type */
  accuracyByType: AccuracyByType[]
  /** Items with low accuracy (leeches) */
  leeches: Leech[]
  /** Level progression timeline */
  levelTimeline: LevelProgressionData[]
  /** Total review and lesson counts */
  totalStats: {
    totalReviews: number
    totalLessons: number
  }
  /** SRS stage breakdown */
  srsBreakdown: SrsBreakdown
}

const initialData: StatisticsData = {
  overallAccuracy: { totalCorrect: 0, totalIncorrect: 0, percentage: 0 },
  accuracyByType: [],
  leeches: [],
  levelTimeline: [],
  totalStats: { totalReviews: 0, totalLessons: 0 },
  srsBreakdown: { apprentice: 0, guru: 0, master: 0, enlightened: 0, burned: 0 },
}

export function useStatistics() {
  const { db } = useDatabase()
  const [data, setData] = React.useState<StatisticsData>(initialData)
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
      // Fetch all statistics data in parallel
      const [
        overallAccuracy,
        accuracyByType,
        leeches,
        levelTimeline,
        totalStats,
        srsBreakdown,
      ] = await Promise.all([
        getOverallAccuracy(db),
        getAccuracyByType(db),
        getLeeches(db),
        getLevelTimeline(db),
        getTotalReviewStats(db),
        getSrsBreakdown(db),
      ])

      setData({
        overallAccuracy,
        accuracyByType,
        leeches,
        levelTimeline,
        totalStats,
        srsBreakdown,
      })
    } catch (err) {
      console.error("[useStatistics] Error fetching data:", err)
      setError(err instanceof Error ? err.message : "Failed to load statistics")
    } finally {
      setIsLoading(false)
      setIsRefreshing(false)
    }
  }, [db])

  // Initial fetch
  React.useEffect(() => {
    fetchData()
  }, [fetchData])

  const refetch = React.useCallback(() => {
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
