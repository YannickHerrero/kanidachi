import * as React from "react"
import { Pressable, View } from "react-native"
import { useRouter } from "expo-router"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Text } from "@/components/ui/text"
import { SubjectCharacters } from "@/components/subject/subject-characters"
import { useThemeColors } from "@/hooks/useThemeColors"
import { cn } from "@/lib/utils"
import { parseMeanings, parseReadings } from "@/db/queries"
import type { Leech } from "@/hooks/useStatistics"

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

interface LeechListProps {
  leeches: Leech[]
  maxItems?: number
}

export function LeechList({ leeches, maxItems = 10 }: LeechListProps) {
  const colors = useThemeColors()
  const router = useRouter()
  const hasLeeches = leeches.length > 0
  const displayedLeeches = leeches.slice(0, maxItems)

  const handleLeechPress = (subjectId: number) => {
    router.push(`/subject/${subjectId}`)
  }

  return (
    <Card>
      <CardHeader className="pb-2">
        <View className="flex-row items-center justify-between">
          <CardTitle className="text-lg">Leeches</CardTitle>
          {hasLeeches && (
            <Text className="text-sm" style={{ color: colors.mutedForeground }}>
              {leeches.length} item{leeches.length !== 1 ? "s" : ""}
            </Text>
          )}
        </View>
      </CardHeader>
      <CardContent className="gap-1 px-0">
        {/* Description */}
        <Text className="text-xs px-4 pb-2" style={{ color: colors.mutedForeground }}>
          Items you struggle with (accuracy below 75%)
        </Text>

        {/* Leech items */}
        {hasLeeches ? (
          <View>
            {displayedLeeches.map((leech) => (
              <LeechItem
                key={leech.subjectId}
                leech={leech}
                onPress={() => handleLeechPress(leech.subjectId)}
              />
            ))}
            {leeches.length > maxItems && (
              <Text className="text-sm text-center py-3 border-t" style={{ color: colors.mutedForeground, borderColor: colors.border }}>
                +{leeches.length - maxItems} more leeches
              </Text>
            )}
          </View>
        ) : (
          <View className="items-center py-6 px-4">
            <Text className="text-sm text-center" style={{ color: colors.mutedForeground }}>
              No leeches detected! Keep up the good work!
            </Text>
          </View>
        )}
      </CardContent>
    </Card>
  )
}

interface LeechItemProps {
  leech: Leech
  onPress: () => void
}

function LeechItem({ leech, onPress }: LeechItemProps) {
  const colors = useThemeColors()
  const typeColors =
    TYPE_COLORS[leech.subjectType as keyof typeof TYPE_COLORS] ?? TYPE_COLORS.vocabulary

  // Get primary meaning
  const meanings = parseMeanings(leech.subject.meanings)
  const primaryMeaning =
    meanings.find((m) => m.primary)?.meaning ?? meanings[0]?.meaning ?? ""

  // Get primary reading for kanji/vocab
  const readings = parseReadings(leech.subject.readings)
  const primaryReading =
    readings.find((r) => r.primary)?.reading ?? readings[0]?.reading

  // Calculate total incorrect
  const totalIncorrect = leech.meaningIncorrect + leech.readingIncorrect
  const totalCorrect = leech.meaningCorrect + leech.readingCorrect

  return (
    <Pressable
      onPress={onPress}
      className="flex-row items-center px-4 py-3 border-t active:opacity-70"
      style={{ borderColor: colors.border }}
    >
      {/* Character badge */}
      <View
        className={cn(
          "w-10 h-10 rounded-lg items-center justify-center mr-3",
          typeColors.bg
        )}
      >
        <SubjectCharacters
          subject={leech.subject}
          variant="inline"
          inlineSize={18}
          inlineLineHeight={24}
          imageSize={20}
          textClassName={typeColors.text}
        />
      </View>

      {/* Content */}
      <View className="flex-1">
        <Text className="text-base font-medium" style={{ color: colors.foreground }} numberOfLines={1}>
          {primaryMeaning}
        </Text>
        {primaryReading && (
          <Text className="text-sm" style={{ color: colors.mutedForeground }} numberOfLines={1}>
            {primaryReading}
          </Text>
        )}
      </View>

      {/* Accuracy stats */}
      <View className="items-end ml-2">
        <Text
          className="text-base font-bold"
          style={{
            color: leech.percentageCorrect < 50 ? colors.destructive : "#f97316",
          }}
        >
          {leech.percentageCorrect}%
        </Text>
        <Text className="text-xs" style={{ color: colors.mutedForeground }}>
          {totalCorrect}/{totalCorrect + totalIncorrect}
        </Text>
      </View>
    </Pressable>
  )
}
