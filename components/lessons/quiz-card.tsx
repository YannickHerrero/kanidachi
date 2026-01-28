import * as React from "react"
import { Pressable, View } from "react-native"

import { Card, CardContent } from "@/components/ui/card"
import { Text } from "@/components/ui/text"
import { Muted } from "@/components/ui/typography"
import { Button } from "@/components/ui/button"
import { RadicalImage, parseCharacterImages } from "@/components/subject/radical-image"
import { parseMeanings, parseReadings } from "@/db/queries"
import { useThemeColors } from "@/hooks/useThemeColors"
import type { Subject } from "@/stores/lessons"

// Subject type colors
const TYPE_COLORS = {
  radical: "bg-blue-500",
  kanji: "bg-pink-500",
  vocabulary: "bg-purple-500",
  kana_vocabulary: "bg-purple-500",
} as const

interface QuizCardProps {
  subject: Subject
  isFlipped: boolean
  onFlip: () => void
  onGrade: (correct: boolean) => void
}

export function QuizCard({ subject, isFlipped, onFlip, onGrade }: QuizCardProps) {
  const colors = useThemeColors()
  const meanings = parseMeanings(subject.meanings)
  const readings = parseReadings(subject.readings)

  const primaryMeanings = meanings.filter((m) => m.primary).map((m) => m.meaning)
  const primaryReadings = readings.filter((r) => r.primary).map((r) => r.reading)

  const typeColor = TYPE_COLORS[subject.type as keyof typeof TYPE_COLORS] ?? TYPE_COLORS.vocabulary

  // Parse character images for radicals without Unicode characters
  const characterImages = parseCharacterImages(subject.characterImages)
  const isImageOnlyRadical = subject.type === "radical" && !subject.characters && characterImages.length > 0

  return (
    <View className="flex-1 px-4">
      <Pressable
        onPress={!isFlipped ? onFlip : undefined}
        className="flex-1"
        disabled={isFlipped}
      >
        <Card className="flex-1">
          <CardContent className="flex-1 items-center justify-center p-6">
            {/* Character with type-colored background */}
            <View className={`px-8 py-6 rounded-2xl ${typeColor} mb-6`}>
              {isImageOnlyRadical ? (
                <RadicalImage
                  characterImages={characterImages}
                  characters={subject.characters}
                  size="xl"
                  textClassName="text-white"
                />
              ) : (
                <Text className="text-6xl text-white font-semibold">
                  {subject.characters ?? "?"}
                </Text>
              )}
            </View>

            {!isFlipped ? (
              /* Front of card - prompt to flip */
              <View className="items-center">
                <Text className="text-lg mb-2" style={{ color: colors.mutedForeground }}>
                  Do you know this {subject.type === "radical" ? "radical" : "item"}?
                </Text>
                <Muted>Tap to reveal</Muted>
              </View>
            ) : (
              /* Back of card - answer */
              <View className="items-center w-full">
                {/* Meanings */}
                <View className="mb-4 items-center">
                  <Muted className="text-xs mb-1">Meaning</Muted>
                  <Text className="text-2xl font-semibold text-center">
                    {primaryMeanings.join(", ")}
                  </Text>
                </View>

                {/* Readings (if applicable) */}
                {primaryReadings.length > 0 && (
                  <View className="mb-4 items-center">
                    <Muted className="text-xs mb-1">Reading</Muted>
                    <Text className="text-2xl font-semibold text-center">
                      {primaryReadings.join(", ")}
                    </Text>
                  </View>
                )}

                {/* Mnemonic hint */}
                {subject.meaningMnemonic && (
                  <View className="mt-2 p-3 rounded-lg w-full" style={{ backgroundColor: colors.muted }}>
                    <Text className="text-sm text-center" numberOfLines={3}>
                      {subject.meaningMnemonic}
                    </Text>
                  </View>
                )}
              </View>
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
            className="flex-1 h-14 bg-green-600"
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
