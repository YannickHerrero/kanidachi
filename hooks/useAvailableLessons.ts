import * as React from "react"
import { useDatabase } from "@/db/provider"
import { getAvailableLessons, getSubjectsByIds } from "@/db/queries"
import type { LessonItem } from "@/stores/lessons"

export type SubjectTypeFilter = "all" | "radical" | "kanji" | "vocabulary"

interface UseAvailableLessonsResult {
  items: LessonItem[]
  filteredItems: LessonItem[]
  isLoading: boolean
  error: string | null
  refetch: () => Promise<void>
  setTypeFilter: (filter: SubjectTypeFilter) => void
  typeFilter: SubjectTypeFilter
}

export function useAvailableLessons(): UseAvailableLessonsResult {
  const { db } = useDatabase()
  const [items, setItems] = React.useState<LessonItem[]>([])
  const [isLoading, setIsLoading] = React.useState(true)
  const [error, setError] = React.useState<string | null>(null)
  const [typeFilter, setTypeFilter] = React.useState<SubjectTypeFilter>("all")

  const fetchLessons = React.useCallback(async () => {
    if (!db) return

    setIsLoading(true)
    setError(null)

    try {
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

      // Sort by level, then by type (radicals first, then kanji, then vocab)
      lessonItems.sort((a, b) => {
        if (a.subject.level !== b.subject.level) {
          return a.subject.level - b.subject.level
        }
        const typeOrder = { radical: 0, kanji: 1, vocabulary: 2, kana_vocabulary: 3 }
        const aOrder = typeOrder[a.subject.type as keyof typeof typeOrder] ?? 4
        const bOrder = typeOrder[b.subject.type as keyof typeof typeOrder] ?? 4
        return aOrder - bOrder
      })

      setItems(lessonItems)
    } catch (err) {
      console.error("[useAvailableLessons] Error:", err)
      setError(err instanceof Error ? err.message : "Failed to load lessons")
    } finally {
      setIsLoading(false)
    }
  }, [db])

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
  }
}
