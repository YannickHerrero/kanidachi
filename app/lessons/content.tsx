import * as React from "react"
import { View } from "react-native"
import { SafeAreaView } from "react-native-safe-area-context"
import { useRouter, Stack } from "expo-router"
import { ChevronLeft, ChevronRight, FastForward } from "lucide-react-native"

import { Button } from "@/components/ui/button"
import { Text } from "@/components/ui/text"
import { LessonContent } from "@/components/lessons"
import {
  useLessonStore,
  selectCurrentContentItem,
  selectContentProgress,
  selectAllViewed,
} from "@/stores/lessons"
import { useThemeColors } from "@/hooks/useThemeColors"
import { useActivityTimer } from "@/hooks/useActivityTimer"

export default function LessonContentScreen() {
  const router = useRouter()
  const colors = useThemeColors()

  const {
    phase,
    nextContent,
    previousContent,
    markViewed,
    startQuiz,
  } = useLessonStore()

  const currentItem = useLessonStore(selectCurrentContentItem)
  const progress = useLessonStore(selectContentProgress)
  const allViewed = useLessonStore(selectAllViewed)

  useActivityTimer("lessons", phase === "content")

  // Mark current item as viewed
  React.useEffect(() => {
    if (currentItem) {
      markViewed(currentItem.subject.id)
    }
  }, [currentItem, markViewed])

  // Redirect if in select phase (user navigated here without going through the flow)
  // We allow "quiz" and "complete" phases as the user may have triggered navigation
  // to those screens and this effect runs during the transition
  React.useEffect(() => {
    if (phase === "select") {
      router.replace("/lessons")
    }
  }, [phase, router])

  const handleBack = () => {
    router.back()
  }

  const handleNext = () => {
    if (progress.current < progress.total) {
      nextContent()
    }
  }

  const handlePrevious = () => {
    if (progress.current > 1) {
      previousContent()
    }
  }

  const handleStartQuiz = () => {
    startQuiz()
    router.replace("/lessons/quiz")
  }

  if (!currentItem) {
    return null
  }

  const isLastItem = progress.current === progress.total
  const isFirstItem = progress.current === 1

  return (
    <SafeAreaView className="flex-1" style={{ backgroundColor: colors.background }} edges={["top"]}>
      <Stack.Screen
        options={{
          headerShown: false,
        }}
      />

      {/* Header */}
      <View className="flex-row items-center justify-between px-4 py-3 border-b" style={{ borderColor: colors.border }}>
        <Button variant="ghost" size="icon" onPress={handleBack}>
          <ChevronLeft
            size={24}
            color={colors.foreground}
          />
        </Button>

        <Text className="text-base font-medium">
          {progress.current} / {progress.total}
        </Text>

        {/* Skip to Quiz button - always visible, Start Quiz when all viewed */}
        {isLastItem && allViewed ? (
          <Button size="sm" onPress={handleStartQuiz}>
            <Text style={{ color: colors.primaryForeground }}>Start Quiz</Text>
          </Button>
        ) : (
          <Button
            variant="ghost"
            size="sm"
            onPress={handleStartQuiz}
            className="flex-row items-center gap-1"
          >
            <FastForward size={16} color={colors.mutedForeground} />
            <Text className="text-xs" style={{ color: colors.mutedForeground }}>Skip to Quiz</Text>
          </Button>
        )}
      </View>

      {/* Content */}
      <LessonContent subject={currentItem.subject} />

      {/* Navigation */}
      <View className="flex-row items-center justify-between px-4 py-4 border-t" style={{ borderColor: colors.border }}>
        <Button
          variant="outline"
          onPress={handlePrevious}
          disabled={isFirstItem}
          className="flex-row items-center gap-1"
        >
          <ChevronLeft
            size={18}
            color={isFirstItem ? colors.mutedForeground : colors.foreground}
          />
          <Text style={isFirstItem ? { color: colors.mutedForeground } : undefined}>
            Previous
          </Text>
        </Button>

        {isLastItem ? (
          <Button onPress={handleStartQuiz}>
            <Text style={{ color: colors.primaryForeground }}>Start Quiz</Text>
          </Button>
        ) : (
          <Button
            onPress={handleNext}
            className="flex-row items-center gap-1"
          >
            <Text style={{ color: colors.primaryForeground }}>Next</Text>
            <ChevronRight size={18} color={colors.primaryForeground} />
          </Button>
        )}
      </View>
    </SafeAreaView>
  )
}
