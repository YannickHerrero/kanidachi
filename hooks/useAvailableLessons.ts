import * as React from "react"
import { useDatabase } from "@/db/provider"
import { getAvailableLessons, getSubjectsByIds, getCurrentUser } from "@/db/queries"
import type { LessonItem } from "@/stores/lessons"
import { useSettingsStore, type LessonOrdering } from "@/stores/settings"

export type SubjectTypeFilter = "all" | "radical" | "kanji" | "vocabulary"

interface UseAvailableLessonsResult {
  items: LessonItem[]
  filteredItems: LessonItem[]
  isLoading: boolean
  error: string | null
  refetch: () => Promise<void>
  setTypeFilter: (filter: SubjectTypeFilter) => void
  typeFilter: SubjectTypeFilter
  userLevel: number | null
}

/**
 * Sort lesson items based on ordering preference
 */
function sortLessonItems(
  items: LessonItem[],
  ordering: LessonOrdering,
  currentLevel?: number | null
): LessonItem[] {
  const sorted = [...items]

  switch (ordering) {
    case "ascending_level":
      return sorted.sort((a, b) => {
        if (a.subject.level !== b.subject.level) {
          return a.subject.level - b.subject.level
        }
        const typeOrder = { radical: 0, kanji: 1, vocabulary: 2, kana_vocabulary: 3 }
        return (
          (typeOrder[a.subject.type as keyof typeof typeOrder] ?? 4) -
          (typeOrder[b.subject.type as keyof typeof typeOrder] ?? 4)
        )
      })

    case "current_level_first":
      return sorted.sort((a, b) => {
        const aIsCurrent = currentLevel && a.subject.level === currentLevel
        const bIsCurrent = currentLevel && b.subject.level === currentLevel

        if (aIsCurrent && !bIsCurrent) return -1
        if (!aIsCurrent && bIsCurrent) return 1

        if (a.subject.level !== b.subject.level) {
          return a.subject.level - b.subject.level
        }

        const typeOrder = { radical: 0, kanji: 1, vocabulary: 2, kana_vocabulary: 3 }
        return (
          (typeOrder[a.subject.type as keyof typeof typeOrder] ?? 4) -
          (typeOrder[b.subject.type as keyof typeof typeOrder] ?? 4)
        )
      })

    case "shuffled":
      for (let i = sorted.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1))
        ;[sorted[i], sorted[j]] = [sorted[j], sorted[i]]
      }
      return sorted

    default:
      return sorted
  }
}

export function useAvailableLessons(): UseAvailableLessonsResult {
  const { db } = useDatabase()
  const [items, setItems] = React.useState<LessonItem[]>([])
  const [isLoading, setIsLoading] = React.useState(true)
  const [error, setError] = React.useState<string | null>(null)
  const [typeFilter, setTypeFilter] = React.useState<SubjectTypeFilter>("all")
  const [userLevel, setUserLevel] = React.useState<number | null>(null)

  const lessonOrdering = useSettingsStore((s) => s.lessonOrdering)

  const fetchLessons = React.useCallback(async () => {
    if (!db) return

    setIsLoading(true)
    setError(null)

    try {
      // Get current user level
      const user = await getCurrentUser(db)
      const currentLevel = user?.level ?? null
      setUserLevel(currentLevel)

      // Get assignments available for lessons
      const assignments = await getAvailableLessons(db)

      if (assignments.length === 0) {
        setItems([])
        setIsLoading(false)
        return
      }

      // Get subject IDs from assignments
      const subjectIds = assignments.map((a) => a.subjectId)

      // Fetch corresponding subjects
      const subjects = await getSubjectsByIds(db, subjectIds)

      // Create a map for quick lookup
      const subjectMap = new Map(subjects.map((s) => [s.id, s]))

      // Combine assignments with subjects
      const lessonItems: LessonItem[] = []
      for (const assignment of assignments) {
        const subject = subjectMap.get(assignment.subjectId)
        if (subject) {
          lessonItems.push({ assignment, subject })
        }
      }

      // Sort based on user's preference
      const sortedItems = sortLessonItems(lessonItems, lessonOrdering, currentLevel)

      setItems(sortedItems)
    } catch (err) {
      console.error("[useAvailableLessons] Error:", err)
      setError(err instanceof Error ? err.message : "Failed to load lessons")
    } finally {
      setIsLoading(false)
    }
  }, [db, lessonOrdering])

  // Initial fetch
  React.useEffect(() => {
    fetchLessons()
  }, [fetchLessons])

  // Filter items by type
  const filteredItems = React.useMemo(() => {
    if (typeFilter === "all") return items

    return items.filter((item) => {
      if (typeFilter === "vocabulary") {
        return item.subject.type === "vocabulary" || item.subject.type === "kana_vocabulary"
      }
      return item.subject.type === typeFilter
    })
  }, [items, typeFilter])

  return {
    items,
    filteredItems,
    isLoading,
    error,
    refetch: fetchLessons,
    setTypeFilter,
    typeFilter,
    userLevel,
  }
}
