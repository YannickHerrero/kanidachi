import { create } from "zustand"
import type { subjects, assignments } from "@/db/schema"

// Types
export type Subject = typeof subjects.$inferSelect
export type Assignment = typeof assignments.$inferSelect

export interface ReviewItem {
  assignment: Assignment
  subject: Subject
}

export interface ItemResult {
  assignmentId: number
  subjectId: number
  correct: boolean
  // For combined meaning+reading, we track if they got it wrong
  // In Anki mode, wrong = both meaning and reading wrong
  meaningWrongCount: number
  readingWrongCount: number
}

export interface SessionSummary {
  totalReviewed: number
  correctCount: number
  incorrectCount: number
  accuracy: number
  incorrectItems: ReviewItem[]
  results: ItemResult[]
}

interface ReviewState {
  // Session state
  isActive: boolean
  items: ReviewItem[] // Original items to review
  queue: ReviewItem[] // Current queue (includes wrong items returning)
  currentIndex: number

  // Results tracking
  results: Map<number, ItemResult> // assignmentId -> result

  // Wrong item queue - items that will return after delay
  wrongItemsToReturn: Array<{
    item: ReviewItem
    returnAfterIndex: number // Return after this many items processed
  }>
  itemsProcessed: number // Counter for return delay

  // Wrap-up mode
  isWrapUp: boolean
  wrapUpCount: number // Items remaining in wrap-up batch

  // Card state
  isFlipped: boolean

  // Session status
  isSubmitting: boolean
  error: string | null

  // Actions
  startSession: (items: ReviewItem[]) => void
  flipCard: () => void
  gradeItem: (correct: boolean) => void
  enableWrapUp: (batchSize?: number) => void
  endSession: () => SessionSummary
  reset: () => void
}

const WRONG_ITEM_DELAY = 5 // Wrong items return after 5 other items
const DEFAULT_WRAPUP_BATCH = 10

export const useReviewStore = create<ReviewState>((set, get) => ({
  // Initial state
  isActive: false,
  items: [],
  queue: [],
  currentIndex: 0,
  results: new Map(),
  wrongItemsToReturn: [],
  itemsProcessed: 0,
  isWrapUp: false,
  wrapUpCount: 0,
  isFlipped: false,
  isSubmitting: false,
  error: null,

  startSession: (items) => {
    // Shuffle items for the session
    const shuffled = [...items].sort(() => Math.random() - 0.5)

    set({
      isActive: true,
      items: items,
      queue: shuffled,
      currentIndex: 0,
      results: new Map(),
      wrongItemsToReturn: [],
      itemsProcessed: 0,
      isWrapUp: false,
      wrapUpCount: 0,
      isFlipped: false,
      error: null,
    })
  },

  flipCard: () => {
    set({ isFlipped: true })
  },

  gradeItem: (correct) => {
    const {
      queue,
      currentIndex,
      results,
      wrongItemsToReturn,
      itemsProcessed,
      isWrapUp,
      wrapUpCount,
    } = get()

    const currentItem = queue[currentIndex]
    if (!currentItem) return

    // Get or create result for this assignment
    const existingResult = results.get(currentItem.assignment.id)
    const newResults = new Map(results)

    if (existingResult) {
      // Update existing result (item was wrong before and returned)
      if (!correct) {
        newResults.set(currentItem.assignment.id, {
          ...existingResult,
          // In Anki mode, wrong means both meaning and reading wrong
          meaningWrongCount: existingResult.meaningWrongCount + 1,
          readingWrongCount: existingResult.readingWrongCount + 1,
        })
      } else {
        // Mark as eventually correct
        newResults.set(currentItem.assignment.id, {
          ...existingResult,
          correct: true,
        })
      }
    } else {
      // New result
      newResults.set(currentItem.assignment.id, {
        assignmentId: currentItem.assignment.id,
        subjectId: currentItem.subject.id,
        correct,
        meaningWrongCount: correct ? 0 : 1,
        readingWrongCount: correct ? 0 : 1,
      })
    }

    // Handle wrong items - add back to queue after delay
    let newWrongItems = [...wrongItemsToReturn]
    if (!correct) {
      newWrongItems.push({
        item: currentItem,
        returnAfterIndex: itemsProcessed + WRONG_ITEM_DELAY,
      })
    }

    // Check if any wrong items should return to queue
    const newQueue = [...queue]
    const returningItems = newWrongItems.filter(
      (wi) => wi.returnAfterIndex <= itemsProcessed + 1
    )
    const remainingWrongItems = newWrongItems.filter(
      (wi) => wi.returnAfterIndex > itemsProcessed + 1
    )

    // Insert returning items at random positions after current
    for (const returning of returningItems) {
      const insertPosition =
        currentIndex + 2 + Math.floor(Math.random() * 3) // Insert 2-4 positions ahead
      const clampedPosition = Math.min(insertPosition, newQueue.length)
      newQueue.splice(clampedPosition, 0, returning.item)
    }

    // Move to next item
    const nextIndex = currentIndex + 1
    const newItemsProcessed = itemsProcessed + 1

    // Check if session is complete
    const isComplete = nextIndex >= newQueue.length

    // Handle wrap-up mode
    let newWrapUpCount = wrapUpCount
    if (isWrapUp && wrapUpCount > 0) {
      newWrapUpCount = wrapUpCount - 1
    }

    // If wrap-up and batch done, treat as complete
    const wrapUpComplete = isWrapUp && newWrapUpCount === 0

    if (isComplete || wrapUpComplete) {
      set({
        results: newResults,
        queue: newQueue,
        currentIndex: nextIndex,
        wrongItemsToReturn: remainingWrongItems,
        itemsProcessed: newItemsProcessed,
        wrapUpCount: newWrapUpCount,
        isFlipped: false,
        isActive: false, // Session ends
      })
    } else {
      set({
        results: newResults,
        queue: newQueue,
        currentIndex: nextIndex,
        wrongItemsToReturn: remainingWrongItems,
        itemsProcessed: newItemsProcessed,
        wrapUpCount: newWrapUpCount,
        isFlipped: false,
      })
    }
  },

  enableWrapUp: (batchSize = DEFAULT_WRAPUP_BATCH) => {
    const { queue, currentIndex } = get()
    const remaining = queue.length - currentIndex
    const actualBatch = Math.min(batchSize, remaining)

    set({
      isWrapUp: true,
      wrapUpCount: actualBatch,
    })
  },

  endSession: () => {
    const { items, results } = get()

    const resultsArray = Array.from(results.values())
    const correctCount = resultsArray.filter((r) => r.correct).length
    const incorrectCount = resultsArray.filter((r) => !r.correct).length
    const totalReviewed = resultsArray.length

    // Get items that were incorrect
    const incorrectAssignmentIds = new Set(
      resultsArray.filter((r) => !r.correct).map((r) => r.assignmentId)
    )
    const incorrectItems = items.filter((item) =>
      incorrectAssignmentIds.has(item.assignment.id)
    )

    const summary: SessionSummary = {
      totalReviewed,
      correctCount,
      incorrectCount,
      accuracy: totalReviewed > 0 ? Math.round((correctCount / totalReviewed) * 100) : 0,
      incorrectItems,
      results: resultsArray,
    }

    set({ isActive: false })

    return summary
  },

  reset: () => {
    set({
      isActive: false,
      items: [],
      queue: [],
      currentIndex: 0,
      results: new Map(),
      wrongItemsToReturn: [],
      itemsProcessed: 0,
      isWrapUp: false,
      wrapUpCount: 0,
      isFlipped: false,
      isSubmitting: false,
      error: null,
    })
  },
}))

// Selectors
export const selectCurrentItem = (state: ReviewState) =>
  state.queue[state.currentIndex] ?? null

export const selectProgress = (state: ReviewState) => ({
  current: state.currentIndex + 1,
  total: state.queue.length,
  completed: state.results.size,
})

export const selectRemainingCount = (state: ReviewState) =>
  state.queue.length - state.currentIndex

export const selectIsSessionComplete = (state: ReviewState) =>
  !state.isActive && state.results.size > 0
