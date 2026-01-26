import * as React from "react"
import { useDatabase } from "@/db/provider"
import { getAvailableReviews, getSubjectsByIds } from "@/db/queries"
import { useSettingsStore } from "@/stores/settings"
import type { ReviewItem } from "@/stores/reviews"

interface UseAvailableReviewsResult {
  items: ReviewItem[]
  totalAvailable: number // Total available reviews (before limit)
  isLoading: boolean
  error: string | null
  refetch: () => Promise<void>
}

export function useAvailableReviews(): UseAvailableReviewsResult {
  const { db } = useDatabase()
  const reviewItemLimit = useSettingsStore((s) => s.reviewItemLimit)
  const [items, setItems] = React.useState<ReviewItem[]>([])
  const [totalAvailable, setTotalAvailable] = React.useState(0)
  const [isLoading, setIsLoading] = React.useState(true)
  const [error, setError] = React.useState<string | null>(null)

  const fetchReviews = React.useCallback(async () => {
    if (!db) return

    setIsLoading(true)
    setError(null)

    try {
      // Get assignments available for review
      const allAssignments = await getAvailableReviews(db)

      // Store total available before applying limit
      setTotalAvailable(allAssignments.length)

      if (allAssignments.length === 0) {
        setItems([])
        setIsLoading(false)
        return
      }

      // Apply item limit if set
      const assignments = reviewItemLimit && reviewItemLimit > 0
        ? allAssignments.slice(0, reviewItemLimit)
        : allAssignments

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
    totalAvailable,
    isLoading,
    error,
    refetch: fetchReviews,
  }
}
