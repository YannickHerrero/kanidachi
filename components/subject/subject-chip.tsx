import * as React from "react"
import { Pressable, View } from "react-native"
import { useRouter } from "expo-router"

import { Text } from "@/components/ui/text"
import { SubjectCharacters } from "@/components/subject/subject-characters"
import { cn } from "@/lib/utils"
import type { subjects } from "@/db/schema"

type Subject = typeof subjects.$inferSelect

// Subject type colors
const TYPE_COLORS = {
  radical: "bg-blue-500",
  kanji: "bg-pink-500",
  vocabulary: "bg-purple-500",
  kana_vocabulary: "bg-purple-500",
} as const

interface SubjectChipProps {
  subject: Subject
  size?: "sm" | "md" | "lg"
  showMeaning?: boolean
  onPress?: () => void
}

export function SubjectChip({
  subject,
  size = "md",
  showMeaning = false,
  onPress,
}: SubjectChipProps) {
  const router = useRouter()
  const typeColor = TYPE_COLORS[subject.type as keyof typeof TYPE_COLORS] ?? TYPE_COLORS.vocabulary

  const handlePress = () => {
    if (onPress) {
      onPress()
    } else {
      router.push(`/subject/${subject.id}`)
    }
  }

  // Size classes
  const sizeClasses = {
    sm: "px-2 py-1",
    md: "px-3 py-1.5",
    lg: "px-4 py-2",
  }

  const inlineSizes = {
    sm: { text: 16, lineHeight: 20, image: 18 },
    md: { text: 18, lineHeight: 24, image: 22 },
    lg: { text: 20, lineHeight: 28, image: 26 },
  }

  // Get primary meaning for display
  let primaryMeaning = ""
  if (showMeaning) {
    try {
      const meanings = JSON.parse(subject.meanings)
      primaryMeaning = meanings.find((m: { primary: boolean }) => m.primary)?.meaning ?? ""
    } catch {
      // ignore
    }
  }

  return (
    <Pressable
      onPress={handlePress}
      className={cn(
        "rounded-lg items-center justify-center",
        typeColor,
        sizeClasses[size]
      )}
    >
      <SubjectCharacters
        subject={subject}
        variant="inline"
        inlineSize={inlineSizes[size].text}
        inlineLineHeight={inlineSizes[size].lineHeight}
        imageSize={inlineSizes[size].image}
        textClassName="text-white"
      />
      {showMeaning && primaryMeaning && (
        <Text className="text-white/80 text-xs mt-0.5" numberOfLines={1}>
          {primaryMeaning}
        </Text>
      )}
    </Pressable>
  )
}
