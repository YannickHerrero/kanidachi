import { create } from "zustand"
import type { subjects, assignments } from "@/db/schema"
import type { ReviewOrdering } from "@/stores/settings"

// Types
export type Subject = typeof subjects.$inferSelect
export type Assignment = typeof assignments.$inferSelect

export interface ReviewItem {
  assignment: Assignment
  subject: Subject
}

/**
 * Sort review items based on the specified ordering
 */
function sortReviewItems(items: ReviewItem[], ordering: ReviewOrdering): ReviewItem[] {
  const sorted = [...items]

  switch (ordering) {
    case "random":
      // Fisher-Yates shuffle
      for (let i = sorted.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1))
        ;[sorted[i], sorted[j]] = [sorted[j], sorted[i]]
      }
      return sorted

    case "srs_stage":
      // Lower SRS stages first (Apprentice before Guru, etc.)
      return sorted.sort((a, b) => a.assignment.srsStage - b.assignment.srsStage)

    case "level":
      // Lower levels first
      return sorted.sort((a, b) => a.subject.level - b.subject.level)

    default:
      return sorted
  }
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

// History entry for undo functionality
interface HistoryEntry {
  queue: ReviewItem[]
  currentIndex: number
  results: Map<number, ItemResult>
  wrongItemsToReturn: Array<{ item: ReviewItem; returnAfterIndex: number }>
  itemsProcessed: number
  isFlipped: boolean
  wrapUpCount: number
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

  // Undo history
  history: HistoryEntry[]
  canUndo: boolean

  // Session status
  isSubmitting: boolean
  error: string | null

  // Actions
  startSession: (items: ReviewItem[], ordering?: ReviewOrdering) => void
  flipCard: () => void
  gradeItem: (correct: boolean) => void
  markCorrectOverride: () => void // Override incorrect answer as correct
  askAgainLater: () => void // Return item to end of queue without penalty
  undoLastAnswer: () => void // Undo the last graded item
  enableWrapUp: (batchSize?: number) => void
  endSession: () => SessionSummary
  reset: () => void
}

const WRONG_ITEM_DELAY = 5 // Wrong items return after 5 other items
const DEFAULT_WRAPUP_BATCH = 10
const MAX_HISTORY_SIZE = 10 // Keep up to 10 undo states

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
  history: [],
  canUndo: false,
  isSubmitting: false,
  error: null,

  startSession: (items, ordering = "random") => {
    // Sort items based on ordering preference
    const sorted = sortReviewItems(items, ordering)

    set({
      isActive: true,
      items: items,
      queue: sorted,
      currentIndex: 0,
      results: new Map(),
      wrongItemsToReturn: [],
      itemsProcessed: 0,
      isWrapUp: false,
      wrapUpCount: 0,
      isFlipped: false,
      history: [],
      canUndo: false,
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
      history,
    } = get()

    const currentItem = queue[currentIndex]
    if (!currentItem) return

    // Save current state for undo (before making changes)
    const historyEntry: HistoryEntry = {
      queue: [...queue],
      currentIndex,
      results: new Map(results),
      wrongItemsToReturn: [...wrongItemsToReturn],
      itemsProcessed,
      isFlipped: true, // It was flipped when graded
      wrapUpCount,
    }
    const newHistory = [...history, historyEntry].slice(-MAX_HISTORY_SIZE)

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

    // If we're at the end but still have wrong items pending, append them
    let pendingWrongItems = remainingWrongItems
    if (!isWrapUp && nextIndex >= newQueue.length && pendingWrongItems.length > 0) {
      for (const pending of pendingWrongItems) {
        newQueue.push(pending.item)
      }
      pendingWrongItems = []
    }

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
        wrongItemsToReturn: pendingWrongItems,
        itemsProcessed: newItemsProcessed,
        wrapUpCount: newWrapUpCount,
        isFlipped: false,
        history: newHistory,
        canUndo: true,
        isActive: false, // Session ends
      })
    } else {
      set({
        results: newResults,
        queue: newQueue,
        currentIndex: nextIndex,
        wrongItemsToReturn: pendingWrongItems,
        itemsProcessed: newItemsProcessed,
        wrapUpCount: newWrapUpCount,
        isFlipped: false,
        history: newHistory,
        canUndo: true,
      })
    }
  },

  // Override incorrect answer as correct (for Anki mode when user realizes they knew it)
  markCorrectOverride: () => {
    const { queue, currentIndex, results, history } = get()

    const currentItem = queue[currentIndex]
    if (!currentItem) return

    // Save current state for undo
    const historyEntry: HistoryEntry = {
      queue: [...queue],
      currentIndex,
      results: new Map(results),
      wrongItemsToReturn: [...get().wrongItemsToReturn],
      itemsProcessed: get().itemsProcessed,
      isFlipped: true,
      wrapUpCount: get().wrapUpCount,
    }
    const newHistory = [...history, historyEntry].slice(-MAX_HISTORY_SIZE)

    // Check if there's an existing result (marked wrong before)
    const existingResult = results.get(currentItem.assignment.id)
    const newResults = new Map(results)

    if (existingResult && !existingResult.correct) {
      // Override the wrong answer - decrease wrong counts
      newResults.set(currentItem.assignment.id, {
        ...existingResult,
        correct: true,
        meaningWrongCount: Math.max(0, existingResult.meaningWrongCount - 1),
        readingWrongCount: Math.max(0, existingResult.readingWrongCount - 1),
      })
    } else if (!existingResult) {
      // No existing result, mark as correct
      newResults.set(currentItem.assignment.id, {
        assignmentId: currentItem.assignment.id,
        subjectId: currentItem.subject.id,
        correct: true,
        meaningWrongCount: 0,
        readingWrongCount: 0,
      })
    }

    // Move to next item (don't add to wrong items queue)
    const { itemsProcessed, isWrapUp, wrapUpCount } = get()
    const nextIndex = currentIndex + 1
    const newItemsProcessed = itemsProcessed + 1

    // Check session completion
    const isComplete = nextIndex >= queue.length
    let newWrapUpCount = wrapUpCount
    if (isWrapUp && wrapUpCount > 0) {
      newWrapUpCount = wrapUpCount - 1
    }
    const wrapUpComplete = isWrapUp && newWrapUpCount === 0

    if (isComplete || wrapUpComplete) {
      set({
        results: newResults,
        currentIndex: nextIndex,
        itemsProcessed: newItemsProcessed,
        wrapUpCount: newWrapUpCount,
        isFlipped: false,
        history: newHistory,
        canUndo: true,
        isActive: false,
      })
    } else {
      set({
        results: newResults,
        currentIndex: nextIndex,
        itemsProcessed: newItemsProcessed,
        wrapUpCount: newWrapUpCount,
        isFlipped: false,
        history: newHistory,
        canUndo: true,
      })
    }
  },

  // Ask again later - put item at end of queue without any penalty
  askAgainLater: () => {
    const { queue, currentIndex } = get()

    const currentItem = queue[currentIndex]
    if (!currentItem) return

    // Remove current item and add it to end of queue
    const newQueue = [...queue]
    newQueue.splice(currentIndex, 1) // Remove from current position
    newQueue.push(currentItem) // Add to end

    // Don't increment currentIndex since we removed the item
    // The next item slides into the current position
    set({
      queue: newQueue,
      isFlipped: false,
    })
  },

  // Undo the last graded item
  undoLastAnswer: () => {
    const { history } = get()

    if (history.length === 0) return

    // Pop the last history entry
    const lastEntry = history[history.length - 1]
    const newHistory = history.slice(0, -1)

    set({
      queue: lastEntry.queue,
      currentIndex: lastEntry.currentIndex,
      results: lastEntry.results,
      wrongItemsToReturn: lastEntry.wrongItemsToReturn,
      itemsProcessed: lastEntry.itemsProcessed,
      isFlipped: lastEntry.isFlipped,
      wrapUpCount: lastEntry.wrapUpCount,
      history: newHistory,
      canUndo: newHistory.length > 0,
      isActive: true, // Re-activate session if it ended
    })
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
      history: [],
      canUndo: false,
      isSubmitting: false,
      error: null,
    })
  },
}))

// Selectors
export const selectCurrentItem = (state: ReviewState) =>
  state.queue[state.currentIndex] ?? null

export const selectProgress = (state: ReviewState) => ({
  current: Array.from(state.results.values()).filter(r => r.correct).length,
  total: state.items.length,
  completed: state.results.size,
})

export const selectRemainingCount = (state: ReviewState) =>
  state.queue.length - state.currentIndex

export const selectIsSessionComplete = (state: ReviewState) =>
  !state.isActive && state.results.size > 0
