import * as React from "react"
import { Pressable, View } from "react-native"
import { Check } from "lucide-react-native"

import { Text } from "@/components/ui/text"
import { cn } from "@/lib/utils"
import { parseMeanings } from "@/db/queries"
import type { Subject } from "@/stores/lessons"

// Subject type colors (matching WaniKani)
const TYPE_COLORS = {
  radical: {
    bg: "bg-blue-500 dark:bg-blue-600",
    border: "border-blue-600 dark:border-blue-700",
  },
  kanji: {
    bg: "bg-pink-500 dark:bg-pink-600",
    border: "border-pink-600 dark:border-pink-700",
  },
  vocabulary: {
    bg: "bg-purple-500 dark:bg-purple-600",
    border: "border-purple-600 dark:border-purple-700",
  },
  kana_vocabulary: {
    bg: "bg-purple-500 dark:bg-purple-600",
    border: "border-purple-600 dark:border-purple-700",
  },
} as const

interface SubjectCellProps {
  subject: Subject
  isSelected: boolean
  onToggle: () => void
}

export function SubjectCell({ subject, isSelected, onToggle }: SubjectCellProps) {
  const colors = TYPE_COLORS[subject.type as keyof typeof TYPE_COLORS] ?? TYPE_COLORS.vocabulary

  // Get primary meaning
  const meanings = parseMeanings(subject.meanings)
  const primaryMeaning = meanings.find((m) => m.primary)?.meaning ?? meanings[0]?.meaning ?? ""

  // Truncate long meanings
  const displayMeaning = primaryMeaning.length > 12
    ? `${primaryMeaning.slice(0, 10)}...`
    : primaryMeaning

  return (
    <Pressable onPress={onToggle} className="w-[23%] aspect-square m-[1%]">
      <View
        className={cn(
          "flex-1 rounded-lg border-2 items-center justify-center p-1",
          colors.bg,
          colors.border,
          isSelected && "ring-2 ring-primary ring-offset-2"
        )}
      >
        {/* Selection indicator */}
        {isSelected && (
          <View className="absolute top-1 right-1 w-5 h-5 bg-white rounded-full items-center justify-center">
            <Check size={14} color="#000" strokeWidth={3} />
          </View>
        )}

        {/* Character */}
        <Text
          className="text-white text-2xl font-semibold"
          numberOfLines={1}
        >
          {subject.characters ?? "?"}
        </Text>

        {/* Meaning */}
        <Text
          className="text-white/80 text-xs text-center"
          numberOfLines={1}
        >
          {displayMeaning}
        </Text>
      </View>
    </Pressable>
  )
}
