import * as React from "react"
import { View } from "react-native"
import { SafeAreaView } from "react-native-safe-area-context"
import { useRouter, Stack } from "expo-router"
import { X } from "lucide-react-native"

import { Button } from "@/components/ui/button"
import { Text } from "@/components/ui/text"
import { Progress } from "@/components/ui/progress"
import { Card, CardContent } from "@/components/ui/card"
import { QuizCard } from "@/components/lessons"
import {
  useLessonStore,
  selectCurrentQuizItem,
  selectQuizProgress,
} from "@/stores/lessons"
import { useColorScheme } from "@/lib/useColorScheme"
import { useDatabase } from "@/db/provider"
import { addPendingProgress, markLessonsCompleted } from "@/db/queries"

export default function LessonQuizScreen() {
  const router = useRouter()
  const { colorScheme } = useColorScheme()
  const { db } = useDatabase()

  const { phase, lessonItems, quizResults, submitQuizAnswer, reset } = useLessonStore()
  const currentItem = useLessonStore(selectCurrentQuizItem)
  const progress = useLessonStore(selectQuizProgress)

  const [isFlipped, setIsFlipped] = React.useState(false)
  const [isSubmitting, setIsSubmitting] = React.useState(false)

  // Redirect if in select phase (user navigated here without going through the flow)
  // We allow "content" phase briefly during the transition from content -> quiz
  // as Zustand state update may not have propagated yet when this screen mounts
  React.useEffect(() => {
    if (phase === "select") {
      router.replace("/lessons")
    }
  }, [phase, router])

  // Handle quiz completion
  React.useEffect(() => {
    if (phase === "complete") {
      handleComplete()
    }
  }, [phase])

  const handleComplete = async () => {
    if (!db || isSubmitting) return

    setIsSubmitting(true)

    try {
      // 1. Update local assignments immediately (optimistic update)
      // This removes the items from the lessons queue right away
      const assignmentIds = lessonItems.map((item) => item.assignment.id)
      await markLessonsCompleted(db, assignmentIds)

      // 2. Queue all lesson completions for sync with WaniKani API
      for (const item of lessonItems) {
        await addPendingProgress(db, {
          assignmentId: item.assignment.id,
          subjectId: item.subject.id,
          isLesson: true,
          meaningWrongCount: 0,
          readingWrongCount: 0,
        })
      }

      // Reset store and go back to dashboard
      reset()
      router.replace("/")
    } catch (error) {
      console.error("[LessonQuiz] Error saving progress:", error)
      // Still go back even on error - progress is queued locally
      reset()
      router.replace("/")
    }
  }

  const handleFlip = () => {
    setIsFlipped(true)
  }

  const handleGrade = (correct: boolean) => {
    submitQuizAnswer(correct)
    setIsFlipped(false)
  }

  const handleEndSession = () => {
    reset()
    router.replace("/")
  }

  if (!currentItem && phase === "quiz") {
    return null
  }

  // Show completion screen
  if (phase === "complete" || isSubmitting) {
    const correctCount = Array.from(quizResults.values()).filter((r) => r.correct).length
    const totalCount = lessonItems.length

    return (
      <SafeAreaView className="flex-1 bg-background">
        <Stack.Screen options={{ headerShown: false }} />
        <View className="flex-1 items-center justify-center p-6">
          <Card className="w-full max-w-sm">
            <CardContent className="items-center py-8">
              <Text className="text-4xl mb-2">
                {correctCount === totalCount ? "Perfect!" : "Complete!"}
              </Text>
              <Text className="text-6xl font-bold text-primary mb-4">
                {totalCount}
              </Text>
              <Text className="text-lg text-muted-foreground mb-6">
                lessons completed
              </Text>

              {isSubmitting ? (
                <Text className="text-muted-foreground">Saving progress...</Text>
              ) : (
                <Button onPress={() => router.replace("/")} className="w-full">
                  <Text className="text-primary-foreground">Back to Dashboard</Text>
                </Button>
              )}
            </CardContent>
          </Card>
        </View>
      </SafeAreaView>
    )
  }

  const progressPercentage = progress.total > 0
    ? Math.round((progress.current / progress.total) * 100)
    : 0

  return (
    <SafeAreaView className="flex-1 bg-background" edges={["top"]}>
      <Stack.Screen options={{ headerShown: false }} />

      {/* Header */}
      <View className="flex-row items-center justify-between px-4 py-3">
        <Button variant="ghost" size="icon" onPress={handleEndSession}>
          <X size={24} color={colorScheme === "dark" ? "#fff" : "#000"} />
        </Button>

        <View className="flex-1 mx-4">
          <Progress value={progressPercentage} className="h-2" />
        </View>

        <Text className="text-sm text-muted-foreground w-16 text-right">
          {progress.current}/{progress.total}
        </Text>
      </View>

      {/* Quiz Card */}
      {currentItem && (
        <QuizCard
          subject={currentItem.subject}
          isFlipped={isFlipped}
          onFlip={handleFlip}
          onGrade={handleGrade}
        />
      )}
    </SafeAreaView>
  )
}
