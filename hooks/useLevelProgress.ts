import * as React from "react"
import { useDatabase } from "@/db/provider"
import { getSubjectCountsByLevel, getPassedCountsByLevel, getCurrentUser } from "@/db/queries"

export interface LevelData {
  level: number
  totalCount: number
  passedCount: number
  percentage: number
}

interface UseLevelProgressResult {
  levels: LevelData[]
  userLevel: number
  maxLevel: number
  isLoading: boolean
  error: string | null
  refetch: () => Promise<void>
}

const MAX_WANIKANI_LEVEL = 60

export function useLevelProgress(): UseLevelProgressResult {
  const { db } = useDatabase()
  const [levels, setLevels] = React.useState<LevelData[]>([])
  const [userLevel, setUserLevel] = React.useState(1)
  const [maxLevel, setMaxLevel] = React.useState(MAX_WANIKANI_LEVEL)
  const [isLoading, setIsLoading] = React.useState(true)
  const [error, setError] = React.useState<string | null>(null)

  const fetchLevelProgress = React.useCallback(async () => {
    if (!db) return

    setIsLoading(true)
    setError(null)

    try {
      // Fetch data in parallel
      const [subjectCounts, passedCounts, user] = await Promise.all([
        getSubjectCountsByLevel(db),
        getPassedCountsByLevel(db),
        getCurrentUser(db),
      ])

      // Set user info
      if (user) {
        setUserLevel(user.level)
        setMaxLevel(user.maxLevelGrantedBySubscription)
      }

      // Create maps for quick lookup
      const totalMap = new Map(subjectCounts.map((s) => [s.level, s.cnt]))
      const passedMap = new Map(passedCounts.map((p) => [p.level, p.cnt]))

      // Build level data for all 60 levels
      const levelData: LevelData[] = []
      for (let level = 1; level <= MAX_WANIKANI_LEVEL; level++) {
        const totalCount = totalMap.get(level) ?? 0
        const passedCount = passedMap.get(level) ?? 0
        const percentage = totalCount > 0 ? Math.round((passedCount / totalCount) * 100) : 0

        levelData.push({
          level,
          totalCount,
          passedCount,
          percentage,
        })
      }

      setLevels(levelData)
    } catch (err) {
      console.error("[useLevelProgress] Error:", err)
      setError(err instanceof Error ? err.message : "Failed to load level progress")
    } finally {
      setIsLoading(false)
    }
  }, [db])

  React.useEffect(() => {
    fetchLevelProgress()
  }, [fetchLevelProgress])

  return {
    levels,
    userLevel,
    maxLevel,
    isLoading,
    error,
    refetch: fetchLevelProgress,
  }
}
