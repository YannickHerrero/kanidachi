import { create } from "zustand"
import type { subjects, assignments } from "@/db/schema"
import type { LessonOrdering } from "@/stores/settings"

// Types for lesson items
export type Subject = typeof subjects.$inferSelect
export type Assignment = typeof assignments.$inferSelect

export interface LessonItem {
  assignment: Assignment
  subject: Subject
}

/**
 * Sort lesson items based on the specified ordering
 */
function sortLessonItems(
  items: LessonItem[],
  ordering: LessonOrdering,
  currentUserLevel?: number
): LessonItem[] {
  const sorted = [...items]

  switch (ordering) {
    case "ascending_level":
      // Lower levels first, then by type (radicals -> kanji -> vocab)
      return sorted.sort((a, b) => {
        if (a.subject.level !== b.subject.level) {
          return a.subject.level - b.subject.level
        }
        // Within same level, sort by type
        const typeOrder = { radical: 0, kanji: 1, vocabulary: 2, kana_vocabulary: 3 }
        return (typeOrder[a.subject.type as keyof typeof typeOrder] ?? 4) -
               (typeOrder[b.subject.type as keyof typeof typeOrder] ?? 4)
      })

    case "current_level_first":
      // Current level items first, then lower levels
      return sorted.sort((a, b) => {
        const aIsCurrent = currentUserLevel && a.subject.level === currentUserLevel
        const bIsCurrent = currentUserLevel && b.subject.level === currentUserLevel

        if (aIsCurrent && !bIsCurrent) return -1
        if (!aIsCurrent && bIsCurrent) return 1

        // Within same priority, sort by level ascending
        if (a.subject.level !== b.subject.level) {
          return a.subject.level - b.subject.level
        }

        // Within same level, sort by type
        const typeOrder = { radical: 0, kanji: 1, vocabulary: 2, kana_vocabulary: 3 }
        return (typeOrder[a.subject.type as keyof typeof typeOrder] ?? 4) -
               (typeOrder[b.subject.type as keyof typeof typeOrder] ?? 4)
      })

    case "shuffled":
      // Fisher-Yates shuffle
      for (let i = sorted.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1))
        ;[sorted[i], sorted[j]] = [sorted[j], sorted[i]]
      }
      return sorted

    default:
      return sorted
  }
}

export interface QuizResult {
  subjectId: number
  correct: boolean
}

export type LessonPhase = "select" | "content" | "quiz" | "complete"

interface LessonState {
  // Current phase
  phase: LessonPhase

  // Selection phase
  availableItems: LessonItem[]
  selectedSubjectIds: Set<number>

  // Content viewing phase
  lessonItems: LessonItem[] // Items selected for this session
  contentIndex: number
  viewedSubjectIds: Set<number>

  // Quiz phase
  quizQueue: LessonItem[]
  quizIndex: number
  quizResults: Map<number, QuizResult>

  // Session tracking
  isSubmitting: boolean
  error: string | null

  // Actions - Selection
  setAvailableItems: (items: LessonItem[], ordering?: LessonOrdering, currentUserLevel?: number) => void
  toggleSelection: (subjectId: number) => void
  selectAll: () => void
  deselectAll: () => void

  // Actions - Content
  startContent: (ordering?: LessonOrdering, currentUserLevel?: number) => void
  nextContent: () => void
  previousContent: () => void
  markViewed: (subjectId: number) => void

  // Actions - Quiz
  startQuiz: () => void
  submitQuizAnswer: (correct: boolean) => void

  // Actions - Session
  completeSession: () => void
  reset: () => void
}

export const useLessonStore = create<LessonState>((set, get) => ({
  // Initial state
  phase: "select",
  availableItems: [],
  selectedSubjectIds: new Set(),
  lessonItems: [],
  contentIndex: 0,
  viewedSubjectIds: new Set(),
  quizQueue: [],
  quizIndex: 0,
  quizResults: new Map(),
  isSubmitting: false,
  error: null,

  // Selection actions
  setAvailableItems: (items, ordering = "ascending_level", currentUserLevel) => {
    // Sort available items when setting them
    const sorted = sortLessonItems(items, ordering, currentUserLevel)
    set({ availableItems: sorted })
  },

  toggleSelection: (subjectId) => {
    const { selectedSubjectIds } = get()
    const newSelected = new Set(selectedSubjectIds)
    if (newSelected.has(subjectId)) {
      newSelected.delete(subjectId)
    } else {
      newSelected.add(subjectId)
    }
    set({ selectedSubjectIds: newSelected })
  },

  selectAll: () => {
    const { availableItems } = get()
    const allIds = new Set(availableItems.map((item) => item.subject.id))
    set({ selectedSubjectIds: allIds })
  },

  deselectAll: () => {
    set({ selectedSubjectIds: new Set() })
  },

  // Content actions
  startContent: (ordering = "ascending_level", currentUserLevel) => {
    const { availableItems, selectedSubjectIds } = get()
    const selected = availableItems.filter((item) =>
      selectedSubjectIds.has(item.subject.id)
    )

    if (selected.length === 0) return

    // Sort selected items
    const lessonItems = sortLessonItems(selected, ordering, currentUserLevel)

    set({
      phase: "content",
      lessonItems,
      contentIndex: 0,
      viewedSubjectIds: new Set(),
    })
  },

  nextContent: () => {
    const { contentIndex, lessonItems } = get()
    if (contentIndex < lessonItems.length - 1) {
      set({ contentIndex: contentIndex + 1 })
    }
  },

  previousContent: () => {
    const { contentIndex } = get()
    if (contentIndex > 0) {
      set({ contentIndex: contentIndex - 1 })
    }
  },

  markViewed: (subjectId) => {
    const { viewedSubjectIds } = get()
    const newViewed = new Set(viewedSubjectIds)
    newViewed.add(subjectId)
    set({ viewedSubjectIds: newViewed })
  },

  // Quiz actions
  startQuiz: () => {
    const { lessonItems } = get()

    // Shuffle items for quiz
    const shuffled = [...lessonItems].sort(() => Math.random() - 0.5)

    set({
      phase: "quiz",
      quizQueue: shuffled,
      quizIndex: 0,
      quizResults: new Map(),
    })
  },

  submitQuizAnswer: (correct) => {
    const { quizQueue, quizIndex, quizResults } = get()
    const currentItem = quizQueue[quizIndex]

    if (!currentItem) return

    // Record result
    const newResults = new Map(quizResults)
    newResults.set(currentItem.subject.id, {
      subjectId: currentItem.subject.id,
      correct,
    })

    // If wrong, add back to queue (will appear later)
    let newQueue = [...quizQueue]
    if (!correct) {
      // Add item back to queue, at least 3 items later
      const insertPosition = Math.min(quizIndex + 4, newQueue.length)
      newQueue.splice(insertPosition, 0, currentItem)
    }

    // Move to next item or complete
    const nextIndex = quizIndex + 1
    if (nextIndex >= newQueue.length) {
      // All items completed (including retries)
      set({
        quizResults: newResults,
        quizQueue: newQueue,
        phase: "complete",
      })
    } else {
      set({
        quizResults: newResults,
        quizQueue: newQueue,
        quizIndex: nextIndex,
      })
    }
  },

  // Session actions
  completeSession: () => {
    set({ phase: "complete" })
  },

  reset: () => {
    set({
      phase: "select",
      availableItems: [],
      selectedSubjectIds: new Set(),
      lessonItems: [],
      contentIndex: 0,
      viewedSubjectIds: new Set(),
      quizQueue: [],
      quizIndex: 0,
      quizResults: new Map(),
      isSubmitting: false,
      error: null,
    })
  },
}))

// Selectors
export const selectCurrentContentItem = (state: LessonState) =>
  state.lessonItems[state.contentIndex] ?? null

export const selectCurrentQuizItem = (state: LessonState) =>
  state.quizQueue[state.quizIndex] ?? null

export const selectContentProgress = (state: LessonState) => ({
  current: state.contentIndex + 1,
  total: state.lessonItems.length,
})

export const selectQuizProgress = (state: LessonState) => ({
  current: state.quizIndex + 1,
  total: state.quizQueue.length,
  completed: state.quizResults.size,
})

export const selectSelectedCount = (state: LessonState) =>
  state.selectedSubjectIds.size

export const selectAllViewed = (state: LessonState) =>
  state.lessonItems.length > 0 &&
  state.lessonItems.every((item) => state.viewedSubjectIds.has(item.subject.id))
