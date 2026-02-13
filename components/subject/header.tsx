import * as React from "react"
import { View } from "react-native"

import { Text } from "@/components/ui/text"
import { Badge } from "@/components/ui/badge"
import { SubjectCharacters } from "@/components/subject/subject-characters"
import { useThemeColors } from "@/hooks/useThemeColors"
import { cn } from "@/lib/utils"
import type { subjects, assignments } from "@/db/schema"

type Subject = typeof subjects.$inferSelect
type Assignment = typeof assignments.$inferSelect

// Subject type colors (matching WaniKani)
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

// SRS stage info
const SRS_INFO = {
  0: { label: "Locked", color: null },
  1: { label: "Apprentice I", color: "#ec4899" },
  2: { label: "Apprentice II", color: "#ec4899" },
  3: { label: "Apprentice III", color: "#ec4899" },
  4: { label: "Apprentice IV", color: "#ec4899" },
  5: { label: "Guru I", color: "#a855f7" },
  6: { label: "Guru II", color: "#a855f7" },
  7: { label: "Master", color: "#3b82f6" },
  8: { label: "Enlightened", color: "#06b6d4" },
  9: { label: "Burned", color: "#374151" },
} as const

interface SubjectHeaderProps {
  subject: Subject
  assignment: Assignment | null
}

export function SubjectHeader({ subject, assignment }: SubjectHeaderProps) {
  const colors = useThemeColors()
  const typeColor = TYPE_COLORS[subject.type as keyof typeof TYPE_COLORS] ?? TYPE_COLORS.vocabulary
  const typeLabel = TYPE_LABELS[subject.type as keyof typeof TYPE_LABELS] ?? "Item"

  // Get SRS info
  const srsStage = assignment?.srsStage ?? 0
  const srsInfo = SRS_INFO[srsStage as keyof typeof SRS_INFO] ?? SRS_INFO[0]
  const isStarted = assignment?.startedAt !== null

  // For locked state, use muted color from theme
  const srsBackgroundColor = srsInfo.color ?? colors.muted

  return (
    <View className={cn("items-center py-8 px-4", typeColor)}>
      {/* Character or Radical Image */}
      <View className="mb-3">
        <SubjectCharacters subject={subject} size="xl" textClassName="text-white" />
      </View>

      {/* Type and Level badges */}
      <View className="flex-row items-center gap-2 mb-2">
        <Badge
          variant="outline"
          className="border-transparent"
          style={{ backgroundColor: "rgba(255, 255, 255, 0.2)", borderColor: "transparent" }}
        >
          <Text className="text-xs" style={{ color: "#ffffff" }}>{typeLabel}</Text>
        </Badge>
        <Badge
          variant="outline"
          className="border-transparent"
          style={{ backgroundColor: "rgba(255, 255, 255, 0.2)", borderColor: "transparent" }}
        >
          <Text className="text-xs" style={{ color: "#ffffff" }}>Level {subject.level}</Text>
        </Badge>
      </View>

      {/* SRS Stage */}
      {isStarted && (
        <Badge
          variant="outline"
          className="mt-1 border-transparent"
          style={{ backgroundColor: srsBackgroundColor, borderColor: "transparent" }}
        >
          <Text
            className="text-xs"
            style={{ color: srsStage === 0 ? colors.mutedForeground : "#ffffff" }}
          >
            {srsInfo.label}
          </Text>
        </Badge>
      )}
    </View>
  )
}
