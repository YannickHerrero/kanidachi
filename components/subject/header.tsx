import * as React from "react"
import { View } from "react-native"

import { Text } from "@/components/ui/text"
import { Badge } from "@/components/ui/badge"
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
  0: { label: "Locked", color: "bg-muted" },
  1: { label: "Apprentice I", color: "bg-pink-500" },
  2: { label: "Apprentice II", color: "bg-pink-500" },
  3: { label: "Apprentice III", color: "bg-pink-500" },
  4: { label: "Apprentice IV", color: "bg-pink-500" },
  5: { label: "Guru I", color: "bg-purple-500" },
  6: { label: "Guru II", color: "bg-purple-500" },
  7: { label: "Master", color: "bg-blue-500" },
  8: { label: "Enlightened", color: "bg-cyan-500" },
  9: { label: "Burned", color: "bg-gray-700" },
} as const

interface SubjectHeaderProps {
  subject: Subject
  assignment: Assignment | null
}

export function SubjectHeader({ subject, assignment }: SubjectHeaderProps) {
  const typeColor = TYPE_COLORS[subject.type as keyof typeof TYPE_COLORS] ?? TYPE_COLORS.vocabulary
  const typeLabel = TYPE_LABELS[subject.type as keyof typeof TYPE_LABELS] ?? "Item"
  
  // Get SRS info
  const srsStage = assignment?.srsStage ?? 0
  const srsInfo = SRS_INFO[srsStage as keyof typeof SRS_INFO] ?? SRS_INFO[0]
  const isStarted = assignment?.startedAt !== null

  return (
    <View className={cn("items-center py-8 px-4", typeColor)}>
      {/* Character */}
      <Text className="text-6xl text-white font-semibold mb-3">
        {subject.characters ?? "?"}
      </Text>

      {/* Type and Level badges */}
      <View className="flex-row items-center gap-2 mb-2">
        <Badge variant="secondary" className="bg-white/20">
          <Text className="text-white text-xs">{typeLabel}</Text>
        </Badge>
        <Badge variant="secondary" className="bg-white/20">
          <Text className="text-white text-xs">Level {subject.level}</Text>
        </Badge>
      </View>

      {/* SRS Stage */}
      {isStarted && (
        <Badge className={cn(srsInfo.color, "mt-1")}>
          <Text className="text-white text-xs">{srsInfo.label}</Text>
        </Badge>
      )}
    </View>
  )
}
