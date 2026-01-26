import * as React from "react"
import { useDatabase } from "@/db/provider"
import { getAvailableReviews, getSubjectsByIds } from "@/db/queries"
import type { ReviewItem } from "@/stores/reviews"

interface UseAvailableReviewsResult {
  items: ReviewItem[]
  isLoading: boolean
  error: string | null
  refetch: () => Promise<void>
}

export function useAvailableReviews(): UseAvailableReviewsResult {
  const { db } = useDatabase()
  const [items, setItems] = React.useState<ReviewItem[]>([])
  const [isLoading, setIsLoading] = React.useState(true)
  const [error, setError] = React.useState<string | null>(null)

  const fetchReviews = React.useCallback(async () => {
    if (!db) return

    setIsLoading(true)
    setError(null)

    try {
      // Get assignments available for review
      const assignments = await getAvailableReviews(db)

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
      const reviewItems: ReviewItem[] = []
      for (const assignment of assignments) {
        const subject = subjectMap.get(assignment.subjectId)
        if (subject) {
          reviewItems.push({ assignment, subject })
        }
      }

      setItems(reviewItems)
    } catch (err) {
      console.error("[useAvailableReviews] Error:", err)
      setError(err instanceof Error ? err.message : "Failed to load reviews")
    } finally {
      setIsLoading(false)
    }
  }, [db])

  // Initial fetch
  React.useEffect(() => {
    fetchReviews()
  }, [fetchReviews])

  return {
    items,
    isLoading,
    error,
    refetch: fetchReviews,
  }
}
