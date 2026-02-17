import * as React from "react"
import { Alert, Pressable, View } from "react-native"
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context"
import { useRouter, Stack, useLocalSearchParams } from "expo-router"
import { X } from "lucide-react-native"

import { Button } from "@/components/ui/button"
import { Text } from "@/components/ui/text"
import { Skeleton } from "@/components/ui/skeleton"
import { ErrorView } from "@/components/ui/error-view"
import { EmptyState } from "@/components/ui/empty-state"
import {
  BottomSheet,
  BottomSheetContent,
  BottomSheetHeader,
  BottomSheetScrollView,
  BottomSheetView,
  useBottomSheet,
} from "@/components/ui/bottom-sheet"
import { AnkiCard, GradeButtons, ReviewProgressBar, ReviewActions } from "@/components/reviews"
import { SubjectCharacters } from "@/components/subject/subject-characters"
import { SubjectDetailContent, SubjectHeader } from "@/components/subject"
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
import { useSubject } from "@/hooks/useSubject"

const TYPE_COLORS = {
  radical: "#3b82f6",
  kanji: "#ec4899",
  vocabulary: "#a855f7",
  kana_vocabulary: "#a855f7",
} as const

export default function ReviewSessionScreen() {
  const router = useRouter()
  const colors = useThemeColors()
  const insets = useSafeAreaInsets()
  const { ref: lastReviewedSheetRef, open: openLastReviewedSheet } = useBottomSheet()

  const { mode } = useLocalSearchParams<{ mode?: string }>()
  const isExpress = mode === "express"
  const { items, isLoading, error } = useAvailableReviews(
    isExpress ? { mode: "express" } : undefined
  )

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
  const lastReviewedItem = useReviewStore((s) => s.lastReviewedItem)
  const progress = useReviewStore(selectProgress)
  const remainingCount = useReviewStore(selectRemainingCount)
  const isSessionComplete = useReviewStore(selectIsSessionComplete)

  const lastReviewedSubjectId = lastReviewedItem?.subject.id ?? null
  const {
    data: lastReviewedData,
    studyMaterial: lastReviewedStudyMaterial,
    componentSubjects: lastReviewedComponentSubjects,
    amalgamationSubjects: lastReviewedAmalgamationSubjects,
    visuallySimilarSubjects: lastReviewedVisuallySimilarSubjects,
    isLoading: isLastReviewedLoading,
    error: lastReviewedError,
  } = useSubject(lastReviewedSubjectId)

  const reviewOrdering = useSettingsStore((s) => s.reviewOrdering)
  const wrapUpBatchSize = useSettingsStore((s) => s.wrapUpBatchSize)
  const preferredVoiceActorId = useSettingsStore((s) => s.preferredVoiceActorId)

  useActivityTimer("reviews", isActive)

  // Start session when items are loaded
  React.useEffect(() => {
    if (items.length > 0 && !isActive && !isSessionComplete) {
      startSession(items, isExpress ? "srs_stage" : reviewOrdering)
    }
  }, [items, isActive, isSessionComplete, startSession, reviewOrdering, isExpress])

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

  const lastReviewedType = lastReviewedItem?.subject.type as keyof typeof TYPE_COLORS | undefined
  const lastReviewedColor =
    (lastReviewedType ? TYPE_COLORS[lastReviewedType] : undefined) ?? colors.primary
  const indicatorBottomOffset = insets.bottom + (isFlipped ? 112 : 20)

  const handleOpenLastReviewed = () => {
    if (!lastReviewedItem) return
    openLastReviewedSheet()
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

      {lastReviewedItem && (
        <View
          pointerEvents="box-none"
          style={{
            position: "absolute",
            left: 22,
            bottom: indicatorBottomOffset,
            zIndex: 20,
          }}
        >
          <Pressable
            accessibilityLabel="Show last reviewed card details"
            onPress={handleOpenLastReviewed}
            style={({ pressed }) => ({
              borderRadius: 5,
              paddingHorizontal: 6,
              paddingVertical: 4,
              backgroundColor: colors.card,
              borderWidth: 1,
              borderColor: colors.border,
              opacity: pressed ? 0.85 : 1,
              shadowColor: "#000",
              shadowOpacity: 0.2,
              shadowRadius: 8,
              shadowOffset: { width: 0, height: 3 },
              elevation: 4,
            })}
          >
            <View
              style={{
                minWidth: 34,
                minHeight: 34,
                borderRadius: 5,
                paddingHorizontal: 7,
                justifyContent: "center",
                alignItems: "center",
                backgroundColor: lastReviewedColor,
              }}
            >
              <SubjectCharacters
                subject={lastReviewedItem.subject}
                variant="inline"
                inlineSize={18}
                textClassName="text-white"
              />
            </View>
          </Pressable>
        </View>
      )}

      <BottomSheet>
        <BottomSheetContent
          ref={lastReviewedSheetRef}
          enableDynamicSizing={false}
          snapPoints={["100%"]}
        >
          <BottomSheetHeader style={{ backgroundColor: colors.background }}>
            <Text className="text-xl font-bold pb-1" style={{ color: colors.foreground }}>
              Last reviewed
            </Text>
          </BottomSheetHeader>

          {isLastReviewedLoading && (
            <BottomSheetView className="gap-4 py-4" style={{ backgroundColor: colors.background }}>
              <Skeleton className="h-48 w-full rounded-xl" />
              <Skeleton className="h-24 w-full rounded-xl" />
              <Skeleton className="h-24 w-full rounded-xl" />
            </BottomSheetView>
          )}

          {!isLastReviewedLoading && lastReviewedError && (
            <BottomSheetView className="py-6 items-center" style={{ backgroundColor: colors.background }}>
              <Text style={{ color: colors.destructive }}>{lastReviewedError}</Text>
            </BottomSheetView>
          )}

          {!isLastReviewedLoading && !lastReviewedError && lastReviewedData && (
            <BottomSheetScrollView
              className="flex-1"
              style={{ backgroundColor: colors.background }}
              showsVerticalScrollIndicator={false}
            >
              <SubjectHeader
                subject={lastReviewedData.subject}
                assignment={lastReviewedData.assignment}
              />
              <SubjectDetailContent
                subject={lastReviewedData.subject}
                studyMaterial={lastReviewedStudyMaterial}
                componentSubjects={lastReviewedComponentSubjects}
                amalgamationSubjects={lastReviewedAmalgamationSubjects}
                visuallySimilarSubjects={lastReviewedVisuallySimilarSubjects}
                showBottomPadding={false}
              />
            </BottomSheetScrollView>
          )}
        </BottomSheetContent>
      </BottomSheet>

      {/* Grade buttons - only show when flipped */}
      {isFlipped && <GradeButtons onGrade={handleGrade} />}
    </SafeAreaView>
  )
}
