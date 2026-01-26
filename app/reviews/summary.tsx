import * as React from "react"
import { ScrollView, View } from "react-native"
import { SafeAreaView } from "react-native-safe-area-context"
import { useRouter, Stack } from "expo-router"
import { CheckCircle, XCircle } from "lucide-react-native"

import { Button } from "@/components/ui/button"
import { Text } from "@/components/ui/text"
import { Muted } from "@/components/ui/typography"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { useReviewStore, type SessionSummary } from "@/stores/reviews"
import { useDatabase } from "@/db/provider"
import { addPendingProgress } from "@/db/queries"
import { parseMeanings } from "@/db/queries"
import { useColorScheme } from "@/lib/useColorScheme"

export default function ReviewSummaryScreen() {
  const router = useRouter()
  const { colorScheme } = useColorScheme()
  const { db } = useDatabase()

  const { results, items, reset } = useReviewStore()

  const [isSubmitting, setIsSubmitting] = React.useState(false)
  const [hasSubmitted, setHasSubmitted] = React.useState(false)

  // Calculate summary
  const summary = React.useMemo((): SessionSummary => {
    const resultsArray = Array.from(results.values())
    const correctCount = resultsArray.filter((r) => r.correct).length
    const incorrectCount = resultsArray.filter((r) => !r.correct).length
    const totalReviewed = resultsArray.length

    const incorrectAssignmentIds = new Set(
      resultsArray.filter((r) => !r.correct).map((r) => r.assignmentId)
    )
    const incorrectItems = items.filter((item) =>
      incorrectAssignmentIds.has(item.assignment.id)
    )

    return {
      totalReviewed,
      correctCount,
      incorrectCount,
      accuracy: totalReviewed > 0 ? Math.round((correctCount / totalReviewed) * 100) : 0,
      incorrectItems,
      results: resultsArray,
    }
  }, [results, items])

  // Submit results to pending queue
  React.useEffect(() => {
    if (!db || hasSubmitted || isSubmitting) return

    const submitResults = async () => {
      setIsSubmitting(true)

      try {
        // Queue all review results
        for (const result of summary.results) {
          await addPendingProgress(db, {
            assignmentId: result.assignmentId,
            subjectId: result.subjectId,
            isLesson: false,
            meaningWrongCount: result.meaningWrongCount,
            readingWrongCount: result.readingWrongCount,
          })
        }

        setHasSubmitted(true)
      } catch (error) {
        console.error("[ReviewSummary] Error saving progress:", error)
        // Still mark as submitted - we tried
        setHasSubmitted(true)
      } finally {
        setIsSubmitting(false)
      }
    }

    submitResults()
  }, [db, hasSubmitted, isSubmitting, summary.results])

  const handleDone = () => {
    reset()
    router.replace("/")
  }

  // Get accuracy color
  const getAccuracyColor = () => {
    if (summary.accuracy >= 90) return "text-green-500"
    if (summary.accuracy >= 70) return "text-amber-500"
    return "text-red-500"
  }

  return (
    <SafeAreaView className="flex-1 bg-background">
      <Stack.Screen options={{ headerShown: false }} />

      <ScrollView
        className="flex-1"
        contentContainerClassName="p-4"
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View className="items-center py-8">
          <Text className="text-3xl font-bold mb-2">Session Complete</Text>
          <Text className="text-muted-foreground">
            {isSubmitting ? "Saving progress..." : "Great work!"}
          </Text>
        </View>

        {/* Stats Card */}
        <Card className="mb-6">
          <CardContent className="py-6">
            {/* Accuracy */}
            <View className="items-center mb-6">
              <Text className={`text-6xl font-bold ${getAccuracyColor()}`}>
                {summary.accuracy}%
              </Text>
              <Muted>accuracy</Muted>
            </View>

            <Separator className="mb-6" />

            {/* Counts */}
            <View className="flex-row justify-around">
              <View className="items-center">
                <View className="flex-row items-center gap-2 mb-1">
                  <CheckCircle size={20} color="#22c55e" />
                  <Text className="text-2xl font-semibold text-green-500">
                    {summary.correctCount}
                  </Text>
                </View>
                <Muted>correct</Muted>
              </View>

              <View className="items-center">
                <View className="flex-row items-center gap-2 mb-1">
                  <XCircle size={20} color="#ef4444" />
                  <Text className="text-2xl font-semibold text-red-500">
                    {summary.incorrectCount}
                  </Text>
                </View>
                <Muted>incorrect</Muted>
              </View>

              <View className="items-center">
                <Text className="text-2xl font-semibold mb-1">
                  {summary.totalReviewed}
                </Text>
                <Muted>total</Muted>
              </View>
            </View>
          </CardContent>
        </Card>

        {/* Incorrect Items */}
        {summary.incorrectItems.length > 0 && (
          <Card className="mb-6">
            <CardHeader className="pb-2">
              <CardTitle className="text-base">Items to Review</CardTitle>
            </CardHeader>
            <CardContent className="gap-3">
              {summary.incorrectItems.map((item) => {
                const meanings = parseMeanings(item.subject.meanings)
                const primaryMeaning = meanings.find((m) => m.primary)?.meaning ?? ""

                return (
                  <View
                    key={item.assignment.id}
                    className="flex-row items-center gap-3 p-2 bg-muted rounded-lg"
                  >
                    <View className="w-12 h-12 rounded-lg bg-pink-500 items-center justify-center">
                      <Text className="text-xl text-white font-semibold">
                        {item.subject.characters ?? "?"}
                      </Text>
                    </View>
                    <View className="flex-1">
                      <Text className="font-medium">{primaryMeaning}</Text>
                      <Muted className="text-xs capitalize">
                        {item.subject.type.replace("_", " ")}
                      </Muted>
                    </View>
                  </View>
                )
              })}
            </CardContent>
          </Card>
        )}

        {/* Done Button */}
        <Button
          onPress={handleDone}
          className="h-14"
          disabled={isSubmitting}
        >
          <Text className="text-primary-foreground text-lg font-semibold">
            {isSubmitting ? "Saving..." : "Back to Dashboard"}
          </Text>
        </Button>

        {/* Bottom padding */}
        <View className="h-8" />
      </ScrollView>
    </SafeAreaView>
  )
}
