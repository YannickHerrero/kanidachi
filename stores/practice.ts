import { create } from "zustand"
import type { subjects, assignments } from "@/db/schema"

type Subject = typeof subjects.$inferSelect
type Assignment = typeof assignments.$inferSelect

export interface PracticeItem {
  subject: Subject
  assignment: Assignment | null
}

interface PracticeState {
  // Session state
  isActive: boolean
  items: PracticeItem[]
  currentIndex: number
  isFlipped: boolean

  // Stats (not sent to WaniKani, just for display)
  correctCount: number
  incorrectCount: number

  // Actions
  startSession: (items: PracticeItem[]) => void
  flipCard: () => void
  gradeItem: (correct: boolean) => void
  reset: () => void
}

export const usePracticeStore = create<PracticeState>((set, get) => ({
  isActive: false,
  items: [],
  currentIndex: 0,
  isFlipped: false,
  correctCount: 0,
  incorrectCount: 0,

  startSession: (items) => {
    // Shuffle items
    const shuffled = [...items].sort(() => Math.random() - 0.5)
    
    set({
      isActive: true,
      items: shuffled,
      currentIndex: 0,
      isFlipped: false,
      correctCount: 0,
      incorrectCount: 0,
    })
  },

  flipCard: () => {
    set({ isFlipped: true })
  },

  gradeItem: (correct) => {
    const { items, currentIndex, correctCount, incorrectCount } = get()
    const nextIndex = currentIndex + 1
    const isComplete = nextIndex >= items.length

    set({
      currentIndex: nextIndex,
      isFlipped: false,
      correctCount: correct ? correctCount + 1 : correctCount,
      incorrectCount: correct ? incorrectCount : incorrectCount + 1,
      isActive: !isComplete,
    })
  },

  reset: () => {
    set({
      isActive: false,
      items: [],
      currentIndex: 0,
      isFlipped: false,
      correctCount: 0,
      incorrectCount: 0,
    })
  },
}))

// Selectors
export const selectCurrentPracticeItem = (state: PracticeState) =>
  state.items[state.currentIndex] ?? null

export const selectPracticeProgress = (state: PracticeState) => ({
  current: state.currentIndex + 1,
  total: state.items.length,
  correct: state.correctCount,
  incorrect: state.incorrectCount,
})
