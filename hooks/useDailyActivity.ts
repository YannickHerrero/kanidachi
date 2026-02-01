import * as React from "react"
import { useFocusEffect } from "@react-navigation/native"

import { useDatabase } from "@/db/provider"
import {
  getDailyActivityTotals,
  getLessonsCompletedCountForRange,
  type DailyActivityTotals,
} from "@/db/queries"
import { getLocalDateKey, getLocalDayRangeSeconds } from "@/lib/date-utils"

export interface DailyActivitySummary extends DailyActivityTotals {
  lessonsCompleted: number
  dateKey: string
}

const initialSummary: DailyActivitySummary = {
  reviews: 0,
  lessons: 0,
  lessonsQuiz: 0,
  lessonsCompleted: 0,
  dateKey: getLocalDateKey(),
}

export function useDailyActivity() {
  const { db } = useDatabase()
  const [summary, setSummary] = React.useState<DailyActivitySummary>(initialSummary)
  const [isLoading, setIsLoading] = React.useState(true)
  const [error, setError] = React.useState<string | null>(null)

  const refresh = React.useCallback(async () => {
    if (!db) return

    setIsLoading(true)
    setError(null)

    try {
      const dateKey = getLocalDateKey()
      const { startSeconds, endSeconds } = getLocalDayRangeSeconds()

      const [activityTotals, lessonsCompleted] = await Promise.all([
        getDailyActivityTotals(db, dateKey),
        getLessonsCompletedCountForRange(db, startSeconds, endSeconds),
      ])

      setSummary({
        ...activityTotals,
        lessonsCompleted,
        dateKey,
      })
    } catch (err) {
      console.error("[useDailyActivity] Error loading daily activity:", err)
      setError(err instanceof Error ? err.message : "Failed to load activity")
    } finally {
      setIsLoading(false)
    }
  }, [db])

  React.useEffect(() => {
    refresh()
  }, [refresh])

  useFocusEffect(
    React.useCallback(() => {
      refresh()
    }, [refresh])
  )

  return {
    ...summary,
    isLoading,
    error,
    refresh,
  }
}
