import * as React from "react"
import { useDatabase } from "@/db/provider"
import {
  getAvailableFlashcardReviews,
  getAvailableReviews,
  getSubjectsByIds,
} from "@/db/queries"
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
  const expressLimit = React.useMemo(
    () => (isExpress ? Math.floor(Math.random() * 5) + 1 : null),
    [isExpress]
  )
  const effectiveLimit = isExpress ? expressLimit : reviewItemLimit
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
      const flashcardRows = await getAvailableFlashcardReviews(db)

      // Store total available before applying limit
      setTotalAvailable(allAssignments.length + flashcardRows.length)

      if (allAssignments.length === 0 && flashcardRows.length === 0) {
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
          reviewItems.push({ assignment, subject, source: "wanikani" })
        }
      }

      let virtualSubjectId = -100000
      let virtualAssignmentId = -100000
      for (const row of flashcardRows) {
        const meaning = row.flashcard.wordTranslation
        const reading = row.flashcard.wordReading

        reviewItems.push({
          assignment: {
            id: virtualAssignmentId,
            subjectId: virtualSubjectId,
            subjectType: "vocabulary",
            srsStage: row.assignment.srsStage,
            level: 1,
            unlockedAt: row.assignment.unlockedAt,
            startedAt: row.assignment.startedAt,
            passedAt: row.assignment.passedAt,
            burnedAt: row.assignment.burnedAt,
            availableAt: row.assignment.availableAt,
            resurrectedAt: null,
            dataUpdatedAt: null,
          },
          subject: {
            id: virtualSubjectId,
            type: "vocabulary",
            level: 1,
            characters: row.flashcard.word,
            slug: row.flashcard.word,
            documentUrl: "",
            meanings: JSON.stringify([{ meaning, primary: true, acceptedAnswer: true }]),
            readings: reading
              ? JSON.stringify([{ reading, primary: true, acceptedAnswer: true }])
              : null,
            auxiliaryMeanings: null,
            componentSubjectIds: null,
            amalgamationSubjectIds: null,
            visuallySimilarSubjectIds: null,
            meaningMnemonic: "",
            meaningHint: null,
            readingMnemonic: null,
            readingHint: null,
            contextSentences: JSON.stringify([
              { ja: row.flashcard.sentenceJa, en: row.flashcard.sentenceTranslation },
            ]),
            partsOfSpeech: JSON.stringify(["flashcard"]),
            pronunciationAudios: JSON.stringify([
              row.flashcard.wordAudioUri
                ? {
                    url: row.flashcard.wordAudioUri,
                    contentType: "audio/mpeg",
                    metadata: {
                      gender: "female",
                      sourceId: 0,
                      pronunciation: row.flashcard.word,
                      voiceActorId: 0,
                      voiceActorName: "AI",
                      voiceDescription: "Generated",
                    },
                  }
                : null,
              row.flashcard.sentenceAudioUri
                ? {
                    url: row.flashcard.sentenceAudioUri,
                    contentType: "audio/mpeg",
                    metadata: {
                      gender: "female",
                      sourceId: 1,
                      pronunciation: row.flashcard.sentenceJa,
                      voiceActorId: 0,
                      voiceActorName: "AI",
                      voiceDescription: "Generated",
                    },
                  }
                : null,
            ].filter(Boolean)),
            characterImages: null,
            hiddenAt: null,
            dataUpdatedAt: null,
          },
          source: "flashcard",
          flashcardAssignmentId: row.assignment.id,
        })

        virtualSubjectId -= 1
        virtualAssignmentId -= 1
      }

      const limitedItems = effectiveLimit && effectiveLimit > 0
        ? reviewItems.slice(0, effectiveLimit)
        : reviewItems

      setItems(limitedItems)
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
