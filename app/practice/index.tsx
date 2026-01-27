import * as React from "react"
import { View } from "react-native"
import { SafeAreaView } from "react-native-safe-area-context"
import { useRouter, Stack } from "expo-router"
import { X } from "lucide-react-native"

import { Button } from "@/components/ui/button"
import { Text } from "@/components/ui/text"
import { AnkiCard, GradeButtons, ReviewProgressBar } from "@/components/reviews"
import {
  usePracticeStore,
  selectCurrentPracticeItem,
  selectPracticeProgress,
} from "@/stores/practice"
import { useColorScheme } from "@/lib/useColorScheme"

export default function PracticeSessionScreen() {
  const router = useRouter()
  const { colorScheme } = useColorScheme()

  const {
    isActive,
    isFlipped,
    correctCount,
    incorrectCount,
    flipCard,
    gradeItem,
    reset,
  } = usePracticeStore()

  const currentItem = usePracticeStore(selectCurrentPracticeItem)
  const progress = usePracticeStore(selectPracticeProgress)

  // When practice ends, show summary and go back
  React.useEffect(() => {
    if (!isActive && progress.total > 0) {
      // Practice complete
    }
  }, [isActive, progress.total])

  const handleEndSession = () => {
    reset()
    router.back()
  }

  const handleGrade = (correct: boolean) => {
    gradeItem(correct)
  }

  if (!currentItem) {
    // Practice complete - show summary
    if (progress.total > 0) {
      const accuracy = Math.round((correctCount / progress.total) * 100)
      return (
        <SafeAreaView className="flex-1 bg-background" edges={["top"]}>
          <Stack.Screen options={{ headerShown: false }} />
          <View className="flex-1 items-center justify-center p-6 gap-6">
            <Text className="text-2xl font-bold">Practice Complete!</Text>
            <View className="bg-card rounded-xl p-6 w-full gap-4">
              <View className="flex-row justify-between">
                <Text className="text-muted-foreground">Items Practiced</Text>
                <Text className="font-semibold">{progress.total}</Text>
              </View>
              <View className="flex-row justify-between">
                <Text className="text-muted-foreground">Correct</Text>
                <Text className="font-semibold text-green-500">{correctCount}</Text>
              </View>
              <View className="flex-row justify-between">
                <Text className="text-muted-foreground">Incorrect</Text>
                <Text className="font-semibold text-red-500">{incorrectCount}</Text>
              </View>
              <View className="flex-row justify-between pt-2 border-t border-border">
                <Text className="text-muted-foreground">Accuracy</Text>
                <Text className="font-semibold">{accuracy}%</Text>
              </View>
            </View>
            <Text className="text-sm text-muted-foreground text-center">
              Practice mode - results not sent to WaniKani
            </Text>
            <Button onPress={handleEndSession} className="w-full">
              <Text className="text-primary-foreground font-semibold">Done</Text>
            </Button>
          </View>
        </SafeAreaView>
      )
    }

    // No items
    return (
      <SafeAreaView className="flex-1 bg-background">
        <Stack.Screen options={{ headerShown: false }} />
        <View className="flex-1 items-center justify-center p-4">
          <Text className="text-muted-foreground">No items to practice</Text>
          <Button onPress={handleEndSession} className="mt-4">
            <Text>Go Back</Text>
          </Button>
        </View>
      </SafeAreaView>
    )
  }

  return (
    <SafeAreaView className="flex-1 bg-background" edges={["top"]}>
      <Stack.Screen options={{ headerShown: false }} />

      {/* Header */}
      <View className="flex-row items-center justify-between px-4 py-3">
        <Button variant="ghost" size="icon" onPress={handleEndSession}>
          <X size={24} color={colorScheme === "dark" ? "#fff" : "#000"} />
        </Button>

        <View className="flex-1 mx-2">
          <ReviewProgressBar
            current={progress.current}
            total={progress.total}
            completed={progress.current - 1}
          />
        </View>

        <View className="bg-amber-500/20 px-2 py-1 rounded">
          <Text className="text-xs text-amber-600 dark:text-amber-400">
            Practice
          </Text>
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
