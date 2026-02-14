import * as React from "react"
import { Pressable, View } from "react-native"
import { useRouter } from "expo-router"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Text } from "@/components/ui/text"
import { Muted } from "@/components/ui/typography"
import { parseMeanings, parseReadings } from "@/db/queries"
import { useThemeColors } from "@/hooks/useThemeColors"

// Subject type colors
const TYPE_COLORS = {
  radical: "bg-blue-500",
  kanji: "bg-pink-500",
  vocabulary: "bg-purple-500",
  kana_vocabulary: "bg-purple-500",
} as const

interface UsedInVocabularyItem {
  id: number
  characters: string | null
  meanings: string
  readings: string
  type: string
}

interface UsedInVocabularySectionProps {
  items: UsedInVocabularyItem[]
  title?: string
  limit?: number
  variant?: "card" | "inline"
  titleAlign?: "left" | "center"
  showMoreLabel?: boolean
}

export function UsedInVocabularySection({
  items,
  title = "Used in Vocabulary",
  limit = 6,
  variant = "card",
  titleAlign = "left",
  showMoreLabel = true,
}: UsedInVocabularySectionProps) {
  const router = useRouter()
  const colors = useThemeColors()

  if (items.length === 0) {
    return null
  }

  const displayItems = limit > 0 ? items.slice(0, limit) : items
  const hasMore = limit > 0 && items.length > limit

  const getPrimaryMeaning = (item: UsedInVocabularyItem): string => {
    const itemMeanings = parseMeanings(item.meanings)
    return itemMeanings.find((m) => m.primary)?.meaning ?? ""
  }

  const getPrimaryReading = (item: UsedInVocabularyItem): string => {
    const itemReadings = parseReadings(item.readings)
    return itemReadings.find((r) => r.primary)?.reading ?? itemReadings[0]?.reading ?? ""
  }

  const handleOpenSubject = (itemId: number) => {
    router.push(`/subject/${itemId}`)
  }

  const content = (
    <View className="gap-2">
      {displayItems.map((item) => {
        const itemTypeColor = TYPE_COLORS[item.type as keyof typeof TYPE_COLORS] ?? TYPE_COLORS.vocabulary
        return (
          <View key={item.id} className="w-full">
            <Pressable onPress={() => handleOpenSubject(item.id)} style={{ width: "100%" }}>
              <View
                className="flex-row items-center rounded-lg overflow-hidden"
                style={{ backgroundColor: colors.muted }}
              >
                <View className={itemTypeColor} style={{ width: 6, alignSelf: "stretch" }} />
                <View className="flex-row items-center gap-3 px-3 py-2 flex-1">
                  <View className={`items-center justify-center rounded-md px-3 py-1 ${itemTypeColor}`}>
                    <Text className="text-base font-semibold text-white">
                      {item.characters ?? ""}
                    </Text>
                  </View>
                  <View className="flex-1">
                    <Text className="text-base font-semibold" numberOfLines={1}>
                      {getPrimaryMeaning(item)}
                    </Text>
                    <Muted className="text-xs" numberOfLines={1}>
                      {getPrimaryReading(item)}
                    </Muted>
                  </View>
                </View>
              </View>
            </Pressable>
          </View>
        )
      })}
      {showMoreLabel && hasMore && (
        <Muted className="text-sm mt-1">+{items.length - displayItems.length} more...</Muted>
      )}
    </View>
  )

  if (variant === "inline") {
    return (
      <View className="w-full">
        {title && (
          <Muted className="text-xs mb-2" style={{ textAlign: titleAlign }}>
            {title}
          </Muted>
        )}
        {content}
      </View>
    )
  }

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-base">{title}</CardTitle>
      </CardHeader>
      <CardContent>{content}</CardContent>
    </Card>
  )
}
