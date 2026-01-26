import * as React from "react"
import { Pressable, View } from "react-native"

import { Text } from "@/components/ui/text"
import { Badge } from "@/components/ui/badge"
import { InlineRadicalImage, parseCharacterImages } from "@/components/subject/radical-image"
import { cn } from "@/lib/utils"
import { parseMeanings, parseReadings } from "@/db/queries"
import type { subjects, assignments } from "@/db/schema"

type Subject = typeof subjects.$inferSelect
type Assignment = typeof assignments.$inferSelect

// Subject type colors (matching WaniKani)
const TYPE_COLORS = {
  radical: {
    bg: "bg-blue-500",
    text: "text-white",
  },
  kanji: {
    bg: "bg-pink-500",
    text: "text-white",
  },
  vocabulary: {
    bg: "bg-purple-500",
    text: "text-white",
  },
  kana_vocabulary: {
    bg: "bg-purple-500",
    text: "text-white",
  },
} as const

// SRS stage colors
const SRS_COLORS = {
  locked: "bg-muted text-muted-foreground",
  lesson: "bg-gray-400 text-white",
  apprentice: "bg-pink-500 text-white",
  guru: "bg-purple-500 text-white",
  master: "bg-blue-500 text-white",
  enlightened: "bg-cyan-500 text-white",
  burned: "bg-gray-700 text-white",
} as const

const SRS_LABELS = {
  locked: "Locked",
  lesson: "Lesson",
  apprentice: "Apprentice",
  guru: "Guru",
  master: "Master",
  enlightened: "Enlightened",
  burned: "Burned",
} as const

function getSrsCategory(assignment: Assignment | null): keyof typeof SRS_COLORS {
  if (!assignment) return "locked"
  if (!assignment.unlockedAt) return "locked"
  if (!assignment.startedAt) return "lesson"
  
  const stage = assignment.srsStage
  if (stage >= 1 && stage <= 4) return "apprentice"
  if (stage >= 5 && stage <= 6) return "guru"
  if (stage === 7) return "master"
  if (stage === 8) return "enlightened"
  if (stage === 9) return "burned"
  return "locked"
}

interface SubjectCellProps {
  subject: Subject
  assignment: Assignment | null
  onPress: () => void
  showSrsStage?: boolean
}

export function SubjectCell({
  subject,
  assignment,
  onPress,
  showSrsStage = true,
}: SubjectCellProps) {
  const typeColors = TYPE_COLORS[subject.type as keyof typeof TYPE_COLORS] ?? TYPE_COLORS.vocabulary
  const srsCategory = getSrsCategory(assignment)
  const isLocked = srsCategory === "locked"

  // Parse character images for radicals without Unicode characters
  const characterImages = parseCharacterImages(subject.characterImages)
  const isImageOnlyRadical = subject.type === "radical" && !subject.characters && characterImages.length > 0

  // Get primary meaning
  const meanings = parseMeanings(subject.meanings)
  const primaryMeaning = meanings.find((m) => m.primary)?.meaning ?? meanings[0]?.meaning ?? ""

  // Get primary reading for kanji/vocab
  const readings = parseReadings(subject.readings)
  const primaryReading = readings.find((r) => r.primary)?.reading ?? readings[0]?.reading

  return (
    <Pressable
      onPress={onPress}
      className={cn(
        "flex-row items-center p-3 border-b border-border",
        isLocked && "opacity-50"
      )}
    >
      {/* Character badge */}
      <View
        className={cn(
          "w-12 h-12 rounded-lg items-center justify-center mr-3",
          isLocked ? "bg-muted" : typeColors.bg
        )}
      >
        {isImageOnlyRadical ? (
          <InlineRadicalImage
            characterImages={characterImages}
            characters={subject.characters}
            size={24}
            className={isLocked ? "text-muted-foreground" : typeColors.text}
          />
        ) : (
          <Text
            className={cn(
              "text-xl font-semibold",
              isLocked ? "text-muted-foreground" : typeColors.text
            )}
          >
            {subject.characters ?? "?"}
          </Text>
        )}
      </View>

      {/* Content */}
      <View className="flex-1">
        <Text className="text-base font-medium text-foreground" numberOfLines={1}>
          {primaryMeaning}
        </Text>
        {primaryReading && (
          <Text className="text-sm text-muted-foreground" numberOfLines={1}>
            {primaryReading}
          </Text>
        )}
      </View>

      {/* SRS Badge */}
      {showSrsStage && (
        <Badge className={cn("ml-2", SRS_COLORS[srsCategory])}>
          <Text className="text-xs">{SRS_LABELS[srsCategory]}</Text>
        </Badge>
      )}
    </Pressable>
  )
}

// Export utilities for other components
export { getSrsCategory, SRS_COLORS, SRS_LABELS, TYPE_COLORS }
