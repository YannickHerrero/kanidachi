import { create } from "zustand"
import type { subjects, assignments } from "@/db/schema"

// Types for lesson items
export type Subject = typeof subjects.$inferSelect
export type Assignment = typeof assignments.$inferSelect

export interface LessonItem {
  assignment: Assignment
  subject: Subject
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
  setAvailableItems: (items: LessonItem[]) => void
  toggleSelection: (subjectId: number) => void
  selectAll: () => void
  deselectAll: () => void

  // Actions - Content
  startContent: () => void
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
  setAvailableItems: (items) => {
    set({ availableItems: items })
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
  startContent: () => {
    const { availableItems, selectedSubjectIds } = get()
    const lessonItems = availableItems.filter((item) =>
      selectedSubjectIds.has(item.subject.id)
    )

    if (lessonItems.length === 0) return

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
