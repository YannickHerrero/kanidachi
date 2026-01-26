import * as React from "react"
import { View } from "react-native"

import { Text } from "@/components/ui/text"
import { Muted } from "@/components/ui/typography"
import type { Subject } from "@/stores/reviews"

// Subject type colors
const TYPE_COLORS = {
  radical: "bg-blue-500",
  kanji: "bg-pink-500",
  vocabulary: "bg-purple-500",
  kana_vocabulary: "bg-purple-500",
} as const

const TYPE_LABELS = {
  radical: "Radical",
  kanji: "Kanji",
  vocabulary: "Vocabulary",
  kana_vocabulary: "Vocabulary",
} as const

interface CardFrontProps {
  subject: Subject
}

export function CardFront({ subject }: CardFrontProps) {
  const typeColor = TYPE_COLORS[subject.type as keyof typeof TYPE_COLORS] ?? TYPE_COLORS.vocabulary
  const typeLabel = TYPE_LABELS[subject.type as keyof typeof TYPE_LABELS] ?? "Item"

  return (
    <View className="flex-1 items-center justify-center">
      {/* Character with type-colored background */}
      <View className={`px-12 py-10 rounded-3xl ${typeColor} mb-8`}>
        <Text className="text-7xl text-white font-semibold">
          {subject.characters ?? "?"}
        </Text>
      </View>

      {/* Type label */}
      <Muted className="text-base mb-4">{typeLabel}</Muted>

      {/* Instruction */}
      <View className="items-center">
        <Text className="text-lg text-muted-foreground">
          Tap to reveal answer
        </Text>
      </View>
    </View>
  )
}
