export const FLASHCARD_SRS_INTERVALS_SECONDS = {
  1: 4 * 60 * 60,
  2: 8 * 60 * 60,
  3: 24 * 60 * 60,
  4: 2 * 24 * 60 * 60,
  5: 7 * 24 * 60 * 60,
  6: 14 * 24 * 60 * 60,
  7: 30 * 24 * 60 * 60,
  8: 120 * 24 * 60 * 60,
  9: 0,
} as const

export function getNextFlashcardSrsStage(currentStage: number, isCorrect: boolean): number {
  if (isCorrect) {
    return Math.min(9, currentStage + 1)
  }

  if (currentStage <= 1) return 1
  if (currentStage <= 4) return Math.max(1, currentStage - 1)
  return Math.max(1, currentStage - 2)
}

export function getFlashcardNextAvailableAt(stage: number, now = Math.floor(Date.now() / 1000)): number {
  const interval = FLASHCARD_SRS_INTERVALS_SECONDS[
    stage as keyof typeof FLASHCARD_SRS_INTERVALS_SECONDS
  ]
  if (!interval || stage >= 9) return now
  return now + interval
}
