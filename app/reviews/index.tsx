import * as React from "react"
import { View } from "react-native"
import { SafeAreaView } from "react-native-safe-area-context"
import { useRouter, Stack } from "expo-router"
import { X, Flag } from "lucide-react-native"

import { Button } from "@/components/ui/button"
import { Text } from "@/components/ui/text"
import { Skeleton } from "@/components/ui/skeleton"
import { AnkiCard, GradeButtons, ReviewProgressBar } from "@/components/reviews"
import { useAvailableReviews } from "@/hooks/useAvailableReviews"
import {
  useReviewStore,
  selectCurrentItem,
  selectProgress,
  selectRemainingCount,
} from "@/stores/reviews"
import { useColorScheme } from "@/lib/useColorScheme"

export default function ReviewSessionScreen() {
  const router = useRouter()
  const { colorScheme } = useColorScheme()

  const { items, isLoading, error } = useAvailableReviews()

  const {
    isActive,
    isFlipped,
    isWrapUp,
    startSession,
    flipCard,
    gradeItem,
    enableWrapUp,
    endSession,
    reset,
  } = useReviewStore()

  const currentItem = useReviewStore(selectCurrentItem)
  const progress = useReviewStore(selectProgress)
  const remainingCount = useReviewStore(selectRemainingCount)

  // Start session when items are loaded
  React.useEffect(() => {
    if (items.length > 0 && !isActive) {
      startSession(items)
    }
  }, [items, isActive, startSession])

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
    enableWrapUp(10)
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
    return (
      <SafeAreaView className="flex-1 bg-background">
        <Stack.Screen options={{ headerShown: false }} />
        <View className="flex-1 items-center justify-center p-4">
          <Text className="text-destructive text-center mb-4">{error}</Text>
          <Button onPress={handleBack}>
            <Text>Go Back</Text>
          </Button>
        </View>
      </SafeAreaView>
    )
  }

  if (items.length === 0) {
    return (
      <SafeAreaView className="flex-1 bg-background">
        <Stack.Screen options={{ headerShown: false }} />
        <View className="flex-1 items-center justify-center p-4">
          <Text className="text-2xl font-semibold mb-2">No Reviews</Text>
          <Text className="text-muted-foreground text-center mb-6">
            You don't have any reviews available right now.
          </Text>
          <Button onPress={handleBack}>
            <Text className="text-primary-foreground">Back to Dashboard</Text>
          </Button>
        </View>
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

        {!isWrapUp && remainingCount > 10 && (
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
          <View className="bg-amber-500/20 px-2 py-1 rounded">
            <Text className="text-xs text-amber-600 dark:text-amber-400">
              Wrap Up
            </Text>
          </View>
        )}

        {!isWrapUp && remainingCount <= 10 && <View className="w-16" />}
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
