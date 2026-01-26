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
import { useColorScheme } from "@/lib/useColorScheme"

export default function LessonContentScreen() {
  const router = useRouter()
  const { colorScheme } = useColorScheme()

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

  // Mark current item as viewed
  React.useEffect(() => {
    if (currentItem) {
      markViewed(currentItem.subject.id)
    }
  }, [currentItem, markViewed])

  // Redirect if not in content phase
  React.useEffect(() => {
    if (phase !== "content") {
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
    <SafeAreaView className="flex-1 bg-background" edges={["top"]}>
      <Stack.Screen
        options={{
          headerShown: false,
        }}
      />

      {/* Header */}
      <View className="flex-row items-center justify-between px-4 py-3 border-b border-border">
        <Button variant="ghost" size="icon" onPress={handleBack}>
          <ChevronLeft
            size={24}
            color={colorScheme === "dark" ? "#fff" : "#000"}
          />
        </Button>

        <Text className="text-base font-medium">
          {progress.current} / {progress.total}
        </Text>

        {/* Skip to Quiz button - always visible, Start Quiz when all viewed */}
        {isLastItem && allViewed ? (
          <Button size="sm" onPress={handleStartQuiz}>
            <Text className="text-primary-foreground">Start Quiz</Text>
          </Button>
        ) : (
          <Button
            variant="ghost"
            size="sm"
            onPress={handleStartQuiz}
            className="flex-row items-center gap-1"
          >
            <FastForward size={16} color={colorScheme === "dark" ? "#9ca3af" : "#6b7280"} />
            <Text className="text-muted-foreground text-xs">Skip to Quiz</Text>
          </Button>
        )}
      </View>

      {/* Content */}
      <LessonContent subject={currentItem.subject} />

      {/* Navigation */}
      <View className="flex-row items-center justify-between px-4 py-4 border-t border-border">
        <Button
          variant="outline"
          onPress={handlePrevious}
          disabled={isFirstItem}
          className="flex-row items-center gap-1"
        >
          <ChevronLeft
            size={18}
            color={isFirstItem ? "#9ca3af" : colorScheme === "dark" ? "#fff" : "#000"}
          />
          <Text className={isFirstItem ? "text-muted-foreground" : ""}>
            Previous
          </Text>
        </Button>

        {isLastItem ? (
          <Button onPress={handleStartQuiz}>
            <Text className="text-primary-foreground">Start Quiz</Text>
          </Button>
        ) : (
          <Button
            onPress={handleNext}
            className="flex-row items-center gap-1"
          >
            <Text className="text-primary-foreground">Next</Text>
            <ChevronRight size={18} color="#fff" />
          </Button>
        )}
      </View>
    </SafeAreaView>
  )
}
