import * as React from "react"
import { ScrollView, View } from "react-native"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Text } from "@/components/ui/text"
import { Muted } from "@/components/ui/typography"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { AudioPlayer } from "@/components/subject/audio-player"
import { parseMeanings, parseReadings, parseContextSentences } from "@/db/queries"
import { useSettingsStore } from "@/stores/settings"
import type { Subject } from "@/stores/lessons"

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

interface LessonContentProps {
  subject: Subject
}

export function LessonContent({ subject }: LessonContentProps) {
  const autoPlayAudio = useSettingsStore((s) => s.autoPlayAudioLessons)
  const meanings = parseMeanings(subject.meanings)
  const readings = parseReadings(subject.readings)
  const contextSentences = parseContextSentences(subject.contextSentences)

  const primaryMeanings = meanings.filter((m) => m.primary).map((m) => m.meaning)
  const secondaryMeanings = meanings.filter((m) => !m.primary && m.acceptedAnswer).map((m) => m.meaning)

  const typeColor = TYPE_COLORS[subject.type as keyof typeof TYPE_COLORS] ?? TYPE_COLORS.vocabulary
  const typeLabel = TYPE_LABELS[subject.type as keyof typeof TYPE_LABELS] ?? "Item"

  // Group readings by type for kanji
  const onyomiReadings = readings.filter((r) => r.type === "onyomi")
  const kunyomiReadings = readings.filter((r) => r.type === "kunyomi")
  const vocabReadings = readings.filter((r) => !r.type) // Vocabulary readings have no type

  return (
    <ScrollView
      className="flex-1 bg-background"
      contentContainerClassName="p-4 gap-4"
      showsVerticalScrollIndicator={false}
    >
      {/* Character Header */}
      <View className={`items-center py-8 rounded-xl ${typeColor}`}>
        <Text className="text-6xl text-white font-semibold mb-2">
          {subject.characters ?? "?"}
        </Text>
        <Badge variant="secondary" className="bg-white/20">
          <Text className="text-white text-xs">
            {typeLabel} - Level {subject.level}
          </Text>
        </Badge>
      </View>

      {/* Meanings */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base">Meanings</CardTitle>
        </CardHeader>
        <CardContent>
          <Text className="text-lg font-medium">
            {primaryMeanings.join(", ")}
          </Text>
          {secondaryMeanings.length > 0 && (
            <Muted className="mt-1">
              Also: {secondaryMeanings.join(", ")}
            </Muted>
          )}
        </CardContent>
      </Card>

      {/* Readings - Only for kanji and vocabulary */}
      {readings.length > 0 && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Readings</CardTitle>
          </CardHeader>
          <CardContent className="gap-2">
            {/* Kanji readings (on'yomi and kun'yomi) */}
            {onyomiReadings.length > 0 && (
              <View>
                <Muted className="text-xs mb-1">On'yomi</Muted>
                <Text className="text-lg">
                  {onyomiReadings.map((r) => r.reading).join(", ")}
                </Text>
              </View>
            )}
            {kunyomiReadings.length > 0 && (
              <View>
                <Muted className="text-xs mb-1">Kun'yomi</Muted>
                <Text className="text-lg">
                  {kunyomiReadings.map((r) => r.reading).join(", ")}
                </Text>
              </View>
            )}
            {/* Vocabulary readings */}
            {vocabReadings.length > 0 && (
              <Text className="text-lg">
                {vocabReadings.map((r) => r.reading).join(", ")}
              </Text>
            )}
          </CardContent>
        </Card>
      )}

      {/* Audio Player - Only for vocabulary */}
      <AudioPlayer subject={subject} autoPlay={autoPlayAudio} />

      {/* Meaning Mnemonic */}
      {subject.meaningMnemonic && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Meaning Mnemonic</CardTitle>
          </CardHeader>
          <CardContent>
            <Text className="text-base leading-relaxed">
              {subject.meaningMnemonic}
            </Text>
            {subject.meaningHint && (
              <View className="mt-3 p-3 bg-muted rounded-lg">
                <Muted className="text-xs mb-1">Hint</Muted>
                <Text className="text-sm">{subject.meaningHint}</Text>
              </View>
            )}
          </CardContent>
        </Card>
      )}

      {/* Reading Mnemonic - Only for kanji and vocabulary */}
      {subject.readingMnemonic && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Reading Mnemonic</CardTitle>
          </CardHeader>
          <CardContent>
            <Text className="text-base leading-relaxed">
              {subject.readingMnemonic}
            </Text>
            {subject.readingHint && (
              <View className="mt-3 p-3 bg-muted rounded-lg">
                <Muted className="text-xs mb-1">Hint</Muted>
                <Text className="text-sm">{subject.readingHint}</Text>
              </View>
            )}
          </CardContent>
        </Card>
      )}

      {/* Context Sentences - Only for vocabulary */}
      {contextSentences.length > 0 && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Context Sentences</CardTitle>
          </CardHeader>
          <CardContent className="gap-4">
            {contextSentences.slice(0, 3).map((sentence, index) => (
              <View key={index}>
                {index > 0 && <Separator className="mb-4" />}
                <Text className="text-base mb-1">{sentence.ja}</Text>
                <Muted>{sentence.en}</Muted>
              </View>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Bottom padding */}
      <View className="h-4" />
    </ScrollView>
  )
}
