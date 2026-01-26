import * as React from "react"
import { View } from "react-native"
import { SafeAreaView } from "react-native-safe-area-context"
import { useRouter, Stack } from "expo-router"
import { X, Flag } from "lucide-react-native"

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
} from "@/stores/reviews"
import { useColorScheme } from "@/lib/useColorScheme"
import { useSettingsStore } from "@/stores/settings"
import { preloadAudio } from "@/lib/audio/cache"
import { parsePronunciationAudios } from "@/db/queries"

export default function ReviewSessionScreen() {
  const router = useRouter()
  const { colorScheme } = useColorScheme()

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

  const reviewOrdering = useSettingsStore((s) => s.reviewOrdering)
  const wrapUpBatchSize = useSettingsStore((s) => s.wrapUpBatchSize)
  const preferredVoiceActorId = useSettingsStore((s) => s.preferredVoiceActorId)

  // Start session when items are loaded
  React.useEffect(() => {
    if (items.length > 0 && !isActive) {
      startSession(items, reviewOrdering)
    }
  }, [items, isActive, startSession, reviewOrdering])

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
    endSession()
    router.replace("/reviews/summary")
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
      <SafeAreaView className="flex-1 bg-background">
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
      <SafeAreaView className="flex-1 bg-background">
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
      <SafeAreaView className="flex-1 bg-background">
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
    <SafeAreaView className="flex-1 bg-background" edges={["top"]}>
      <Stack.Screen options={{ headerShown: false }} />

      {/* Header */}
      <View className="flex-row items-center justify-between px-4 py-3">
        <Button variant="ghost" size="icon" onPress={handleEndSession}>
          <X size={24} color={colorScheme === "dark" ? "#fff" : "#000"} />
        </Button>

        <ReviewProgressBar
          current={progress.current}
          total={progress.total}
          completed={progress.completed}
        />

        <View className="flex-row items-center gap-1">
          {/* Wrap Up button */}
          {!isWrapUp && remainingCount > wrapUpBatchSize && (
            <Button
              variant="outline"
              size="sm"
              onPress={handleWrapUp}
              className="flex-row items-center gap-1"
            >
              <Flag size={14} color={colorScheme === "dark" ? "#fff" : "#000"} />
              <Text className="text-xs">Wrap Up</Text>
            </Button>
          )}

          {isWrapUp && (
            <View className="bg-amber-500/20 px-2 py-1 rounded mr-1">
              <Text className="text-xs text-amber-600 dark:text-amber-400">
                Wrap Up
              </Text>
            </View>
          )}

          {/* Actions menu */}
          <ReviewActions
            canUndo={canUndo}
            isFlipped={isFlipped}
            onUndo={undoLastAnswer}
            onAskAgainLater={askAgainLater}
            onMarkCorrect={markCorrectOverride}
          />
        </View>
      </View>

      {/* Card */}
      <View className="flex-1 py-4">
        <AnkiCard
          subject={currentItem.subject}
          isFlipped={isFlipped}
          onFlip={flipCard}
        />
      </View>

      {/* Grade buttons - only show when flipped */}
      {isFlipped && <GradeButtons onGrade={handleGrade} />}
    </SafeAreaView>
  )
}
