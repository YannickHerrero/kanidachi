import * as React from "react"
import { ScrollView, View } from "react-native"

import { Text } from "@/components/ui/text"
import { Muted } from "@/components/ui/typography"
import { Separator } from "@/components/ui/separator"
import { AudioButton } from "@/components/subject/audio-player"
import { parseMeanings, parseReadings } from "@/db/queries"
import { useSettingsStore } from "@/stores/settings"
import type { Subject } from "@/stores/reviews"

// Subject type colors
const TYPE_COLORS = {
  radical: "bg-blue-500",
  kanji: "bg-pink-500",
  vocabulary: "bg-purple-500",
  kana_vocabulary: "bg-purple-500",
} as const

interface CardBackProps {
  subject: Subject
}

export function CardBack({ subject }: CardBackProps) {
  const autoPlayAudio = useSettingsStore((s) => s.autoPlayAudioReviews)
  const meanings = parseMeanings(subject.meanings)
  const readings = parseReadings(subject.readings)

  // Check if this subject has audio (vocabulary or kana_vocabulary)
  const hasAudio = subject.type === "vocabulary" || subject.type === "kana_vocabulary"

  const primaryMeanings = meanings.filter((m) => m.primary).map((m) => m.meaning)
  const secondaryMeanings = meanings.filter((m) => !m.primary && m.acceptedAnswer).map((m) => m.meaning)

  // Group readings by type for kanji
  const onyomiReadings = readings.filter((r) => r.type === "onyomi")
  const kunyomiReadings = readings.filter((r) => r.type === "kunyomi")
  const vocabReadings = readings.filter((r) => !r.type)

  const typeColor = TYPE_COLORS[subject.type as keyof typeof TYPE_COLORS] ?? TYPE_COLORS.vocabulary

  return (
    <ScrollView
      className="flex-1"
      contentContainerClassName="items-center px-4 pb-4"
      showsVerticalScrollIndicator={false}
    >
      {/* Character with audio button */}
      <View className="relative mb-6">
        <View className={`px-8 py-6 rounded-2xl ${typeColor}`}>
          <Text className="text-5xl text-white font-semibold">
            {subject.characters ?? "?"}
          </Text>
        </View>
        {/* Audio button positioned at bottom-right of character */}
        {hasAudio && (
          <View className="absolute -bottom-2 -right-2">
            <AudioButton
              subject={subject}
              size="md"
              autoPlay={autoPlayAudio}
              className="bg-white shadow-md"
            />
          </View>
        )}
      </View>

      {/* Meanings */}
      <View className="w-full mb-4">
        <Muted className="text-xs text-center mb-1">Meaning</Muted>
        <Text className="text-2xl font-semibold text-center">
          {primaryMeanings.join(", ")}
        </Text>
        {secondaryMeanings.length > 0 && (
          <Muted className="text-center mt-1">
            Also: {secondaryMeanings.join(", ")}
          </Muted>
        )}
      </View>

      {/* Readings */}
      {readings.length > 0 && (
        <View className="w-full mb-4">
          <Muted className="text-xs text-center mb-1">Reading</Muted>

          {/* Kanji readings */}
          {onyomiReadings.length > 0 && (
            <View className="mb-1">
              <Text className="text-xl font-semibold text-center">
                {onyomiReadings.map((r) => r.reading).join(", ")}
              </Text>
              <Muted className="text-xs text-center">(on'yomi)</Muted>
            </View>
          )}
          {kunyomiReadings.length > 0 && (
            <View className="mb-1">
              <Text className="text-xl font-semibold text-center">
                {kunyomiReadings.map((r) => r.reading).join(", ")}
              </Text>
              <Muted className="text-xs text-center">(kun'yomi)</Muted>
            </View>
          )}

          {/* Vocabulary readings */}
          {vocabReadings.length > 0 && (
            <Text className="text-2xl font-semibold text-center">
              {vocabReadings.map((r) => r.reading).join(", ")}
            </Text>
          )}
        </View>
      )}

      <Separator className="my-4 w-full" />

      {/* Mnemonic */}
      {subject.meaningMnemonic && (
        <View className="w-full">
          <Muted className="text-xs mb-2">Mnemonic</Muted>
          <Text className="text-base leading-relaxed">
            {subject.meaningMnemonic}
          </Text>
        </View>
      )}

      {/* Reading mnemonic for kanji/vocab */}
      {subject.readingMnemonic && (
        <View className="w-full mt-4">
          <Muted className="text-xs mb-2">Reading Mnemonic</Muted>
          <Text className="text-base leading-relaxed">
            {subject.readingMnemonic}
          </Text>
        </View>
      )}
    </ScrollView>
  )
}
