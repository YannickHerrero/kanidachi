import { Pressable, View } from "react-native"

import { Card, CardContent } from "@/components/ui/card"
import { Text } from "@/components/ui/text"
import { Button } from "@/components/ui/button"
import { useThemeColors } from "@/hooks/useThemeColors"
import { CardBack } from "@/components/reviews/card-back"
import { CardFront } from "@/components/reviews/card-front"
import { FlashcardBack } from "@/components/reviews/flashcard-back"
import { FlashcardFront } from "@/components/reviews/flashcard-front"
import { useSettingsStore } from "@/stores/settings"
import type { Assignment, Subject } from "@/stores/lessons"

interface QuizCardProps {
  subject: Subject
  assignment: Assignment
  source?: "wanikani" | "flashcard"
  isFlipped: boolean
  onFlip: () => void
  onGrade: (correct: boolean) => void
}

export function QuizCard({ subject, assignment, source, isFlipped, onFlip, onGrade }: QuizCardProps) {
  const colors = useThemeColors()
  const passColor = "#22c55e"
  const isFlashcard = source === "flashcard"
  const autoPlayAudio = useSettingsStore((s) => s.autoPlayAudioLessons)

  return (
    <View className="flex-1">
      <Pressable
        onPress={!isFlipped ? onFlip : undefined}
        style={{ flex: 1 }}
        disabled={isFlipped}
      >
        <Card className="flex-1 mx-4">
          <CardContent className="flex-1 py-6">
            {isFlipped ? (
              isFlashcard ? (
                <FlashcardBack subject={subject} autoPlaySentenceAudio={autoPlayAudio} />
              ) : (
                <CardBack subject={subject} assignment={assignment} />
              )
            ) : (
              isFlashcard ? <FlashcardFront subject={subject} /> : <CardFront subject={subject} />
            )}
          </CardContent>
        </Card>
      </Pressable>

      {/* Grade buttons - only show when flipped */}
      {isFlipped && (
        <View className="flex-row gap-4 mt-4 pb-4">
          <Button
            variant="destructive"
            className="flex-1 h-14"
            onPress={() => onGrade(false)}
          >
            <Text className="text-lg font-semibold" style={{ color: colors.destructiveForeground }}>
              Incorrect
            </Text>
          </Button>
          <Button
            className="flex-1 h-14"
            style={{ backgroundColor: passColor }}
            onPress={() => onGrade(true)}
          >
            <Text className="text-white text-lg font-semibold">
              Correct
            </Text>
          </Button>
        </View>
      )}
    </View>
  )
}
