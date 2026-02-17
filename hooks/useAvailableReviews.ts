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

interface UseAvailableReviewsOptions {
  mode?: "express"
}

export function useAvailableReviews(
  options: UseAvailableReviewsOptions = {}
): UseAvailableReviewsResult {
  const { db } = useDatabase()
  const reviewItemLimit = useSettingsStore((s) => s.reviewItemLimit)
  const reviewOrdering = useSettingsStore((s) => s.reviewOrdering)
  const isExpress = options.mode === "express"
  const effectiveOrdering = isExpress ? "srs_stage" : reviewOrdering
  const effectiveLimit = isExpress ? 3 : reviewItemLimit
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

      // Apply ordering before limiting (so limits honor the chosen order)
      const orderedAssignments = (() => {
        switch (effectiveOrdering) {
          case "srs_stage":
            return [...allAssignments].sort((a, b) =>
              (a.srsStage - b.srsStage) || (a.level - b.level) || (a.id - b.id)
            )
          case "level":
            return [...allAssignments].sort((a, b) =>
              (a.level - b.level) || (a.srsStage - b.srsStage) || (a.id - b.id)
            )
          case "random":
          default: {
            const shuffled = [...allAssignments]
            for (let i = shuffled.length - 1; i > 0; i--) {
              const j = Math.floor(Math.random() * (i + 1))
              ;[shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]]
            }
            return shuffled
          }
        }
      })()

      // Apply item limit if set
      const assignments = effectiveLimit && effectiveLimit > 0
        ? orderedAssignments.slice(0, effectiveLimit)
        : orderedAssignments

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
  }, [db, effectiveLimit, effectiveOrdering])

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
