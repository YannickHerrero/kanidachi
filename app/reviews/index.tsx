import * as React from "react"
import { Alert, View } from "react-native"
import { SafeAreaView } from "react-native-safe-area-context"
import { useRouter, Stack } from "expo-router"
import { X } from "lucide-react-native"

import { Button } from "@/components/ui/button"
import { Text } from "@/components/ui/text"
import { Skeleton } from "@/components/ui/skeleton"
import { ErrorView } from "@/components/ui/error-view"
import { EmptyState } from "@/components/ui/empty-state"
import { AnkiCard, GradeButtons, ReviewProgressBar, ReviewActions } from "@/components/reviews"
import { useAvailableReviews } from "@/hooks/useAvailableReviews"
import {
  useReviewStore,
  selectCurrentItem,
  selectProgress,
  selectRemainingCount,
  selectIsSessionComplete,
} from "@/stores/reviews"
import { useThemeColors } from "@/hooks/useThemeColors"
import { useSettingsStore } from "@/stores/settings"
import { preloadAudio } from "@/lib/audio/cache"
import { parsePronunciationAudios } from "@/db/queries"
import { useActivityTimer } from "@/hooks/useActivityTimer"

export default function ReviewSessionScreen() {
  const router = useRouter()
  const colors = useThemeColors()

  const { items, isLoading, error } = useAvailableReviews()

  const {
    isActive,
    isFlipped,
    isWrapUp,
    canUndo,
    startSession,
    flipCard,
    gradeItem,
    markCorrectOverride,
    askAgainLater,
    undoLastAnswer,
    enableWrapUp,
    endSession,
    reset,
  } = useReviewStore()

  const currentItem = useReviewStore(selectCurrentItem)
  const progress = useReviewStore(selectProgress)
  const remainingCount = useReviewStore(selectRemainingCount)
  const isSessionComplete = useReviewStore(selectIsSessionComplete)

  const reviewOrdering = useSettingsStore((s) => s.reviewOrdering)
  const wrapUpBatchSize = useSettingsStore((s) => s.wrapUpBatchSize)
  const preferredVoiceActorId = useSettingsStore((s) => s.preferredVoiceActorId)

  useActivityTimer("reviews", isActive)

  // Start session when items are loaded
  React.useEffect(() => {
    if (items.length > 0 && !isActive && !isSessionComplete) {
      startSession(items, reviewOrdering)
    }
  }, [items, isActive, isSessionComplete, startSession, reviewOrdering])

  // Preload audio for upcoming items
  const queue = useReviewStore((s) => s.queue)
  const currentIndex = useReviewStore((s) => s.currentIndex)

  React.useEffect(() => {
    if (!isActive || queue.length === 0) return

    // Get next few items from queue
    const upcomingItems = queue.slice(currentIndex, currentIndex + 5)
    const itemsToPreload = upcomingItems
      .filter((item) => item.subject.type === "vocabulary" || item.subject.type === "kana_vocabulary")
      .map((item) => ({
        subjectId: item.subject.id,
        audios: parsePronunciationAudios(item.subject.pronunciationAudios),
      }))
      .filter((item) => item.audios.length > 0)

    if (itemsToPreload.length > 0) {
      preloadAudio(itemsToPreload, preferredVoiceActorId ?? undefined, 3)
    }
  }, [isActive, queue, currentIndex, preferredVoiceActorId])

  // Handle session end (no more items)
  React.useEffect(() => {
    if (!isActive && progress.completed > 0) {
      // Session ended, go to summary
      router.replace("/reviews/summary")
    }
  }, [isActive, progress.completed, router])

  const handleEndSession = () => {
    Alert.alert(
      "End review session?",
      "Completed reviews will be saved.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "End session",
          style: "destructive",
          onPress: () => {
            endSession()
            if (progress.completed > 0) {
              router.dismissTo("/reviews/summary")
            } else {
              router.dismissTo("/")
            }
          },
        },
      ]
    )
  }

  const handleGrade = (correct: boolean) => {
    gradeItem(correct)
  }

  const handleWrapUp = () => {
    enableWrapUp(wrapUpBatchSize)
  }

  const handleBack = () => {
    reset()
    router.replace("/")
  }

  if (isLoading) {
    return (
      <SafeAreaView className="flex-1" style={{ backgroundColor: colors.background }}>
        <Stack.Screen options={{ headerShown: false }} />
        <View className="flex-1 p-4 gap-4">
          <View className="flex-row items-center gap-3">
            <Skeleton className="flex-1 h-2" />
            <Skeleton className="w-16 h-4" />
          </View>
          <Skeleton className="flex-1" />
          <View className="flex-row gap-4">
            <Skeleton className="flex-1 h-16" />
            <Skeleton className="flex-1 h-16" />
          </View>
        </View>
      </SafeAreaView>
    )
  }

  if (error) {
    // Determine error type based on message
    const errorType = error.toLowerCase().includes("network") ? "network" : "generic"
    return (
      <SafeAreaView className="flex-1" style={{ backgroundColor: colors.background }}>
        <Stack.Screen options={{ headerShown: false }} />
        <ErrorView
          type={errorType}
          message={error}
          onRetry={handleBack}
        />
      </SafeAreaView>
    )
  }

  if (items.length === 0) {
    return (
      <SafeAreaView className="flex-1" style={{ backgroundColor: colors.background }}>
        <Stack.Screen options={{ headerShown: false }} />
        <EmptyState
          type="reviews"
          actionText="Back to Dashboard"
          onAction={handleBack}
        />
      </SafeAreaView>
    )
  }

  if (!currentItem) {
    return null
  }

  return (
    <SafeAreaView className="flex-1" style={{ backgroundColor: colors.background }} edges={["top"]}>
      <Stack.Screen options={{ headerShown: false }} />

      {/* Header */}
      <View className="flex-row items-center justify-between px-4 py-3">
        <Button variant="ghost" size="icon" onPress={handleEndSession}>
          <X size={24} color={colors.foreground} />
        </Button>

        <View className="flex-1 mx-2">
          <ReviewProgressBar
            current={progress.current}
            total={progress.total}
            completed={progress.completed}
          />
        </View>

        {/* Actions menu */}
        <ReviewActions
          canUndo={canUndo}
          isFlipped={isFlipped}
          canWrapUp={!isWrapUp && remainingCount > wrapUpBatchSize}
          onUndo={undoLastAnswer}
          onAskAgainLater={askAgainLater}
          onMarkCorrect={markCorrectOverride}
          onWrapUp={handleWrapUp}
        />
      </View>

      {/* Card */}
      <View className="flex-1 py-4">
        <AnkiCard
          subject={currentItem.subject}
          assignment={currentItem.assignment}
          isFlipped={isFlipped}
          onFlip={flipCard}
        />
      </View>

      {/* Grade buttons - only show when flipped */}
      {isFlipped && <GradeButtons onGrade={handleGrade} />}
    </SafeAreaView>
  )
}
