import * as React from "react"
import { ScrollView, View } from "react-native"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Text } from "@/components/ui/text"
import { Muted } from "@/components/ui/typography"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { FormattedText } from "@/components/ui/formatted-text"
import { AudioPlayer } from "@/components/subject/audio-player"
import { RadicalImage, parseCharacterImages } from "@/components/subject/radical-image"
import { SubjectChip } from "@/components/subject/subject-chip"
import { parseMeanings, parseReadings, parseContextSentences, parseNumberArray, getSubjectsByIds } from "@/db/queries"
import { useSettingsStore } from "@/stores/settings"
import { useDatabase } from "@/db/provider"
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
  const { db } = useDatabase()
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

  // Parse character images for radicals without Unicode characters
  const characterImages = parseCharacterImages(subject.characterImages)
  const isImageOnlyRadical = subject.type === "radical" && !subject.characters && characterImages.length > 0

  // Fetch component subjects (radicals for kanji, kanji for vocab)
  const componentSubjectIds = parseNumberArray(subject.componentSubjectIds)
  const [componentSubjects, setComponentSubjects] = React.useState<Subject[]>([])

  // Fetch visually similar kanji (for kanji lessons only)
  const visuallySimilarIds = parseNumberArray(subject.visuallySimilarSubjectIds)
  const [visuallySimilarSubjects, setVisuallySimilarSubjects] = React.useState<Subject[]>([])

  React.useEffect(() => {
    if (db && componentSubjectIds.length > 0) {
      getSubjectsByIds(db, componentSubjectIds).then(setComponentSubjects)
    } else {
      setComponentSubjects([])
    }
  }, [db, subject.id])

  React.useEffect(() => {
    if (db && visuallySimilarIds.length > 0 && subject.type === "kanji") {
      getSubjectsByIds(db, visuallySimilarIds).then(setVisuallySimilarSubjects)
    } else {
      setVisuallySimilarSubjects([])
    }
  }, [db, subject.id, subject.type])

  // Determine component section title
  const componentTitle = subject.type === "kanji" 
    ? "Radicals Used" 
    : subject.type === "vocabulary" || subject.type === "kana_vocabulary"
      ? "Kanji Used"
      : "Components"

  return (
    <ScrollView
      className="flex-1 bg-background"
      contentContainerClassName="p-4 gap-4"
      showsVerticalScrollIndicator={false}
    >
      {/* Character Header */}
      <View className={`items-center py-8 rounded-xl ${typeColor}`}>
        {isImageOnlyRadical ? (
          <View className="mb-2">
            <RadicalImage
              characterImages={characterImages}
              characters={subject.characters}
              size="xl"
              textClassName="text-white"
            />
          </View>
        ) : (
          <Text className="text-6xl text-white font-semibold mb-2">
            {subject.characters ?? "?"}
          </Text>
        )}
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

      {/* Component Subjects (Radicals for Kanji, Kanji for Vocab) */}
      {componentSubjects.length > 0 && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">{componentTitle}</CardTitle>
          </CardHeader>
          <CardContent>
            <View className="flex-row flex-wrap gap-2">
              {componentSubjects.map((component) => (
                <SubjectChip
                  key={component.id}
                  subject={component}
                  size="md"
                  showMeaning
                />
              ))}
            </View>
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
            <FormattedText text={subject.meaningMnemonic} />
            {subject.meaningHint && (
              <View className="mt-3 p-3 bg-muted rounded-lg">
                <Muted className="text-xs mb-1">Hint</Muted>
                <FormattedText
                  text={subject.meaningHint}
                  style={{ fontSize: 14, lineHeight: 20 }}
                />
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
            <FormattedText text={subject.readingMnemonic} />
            {subject.readingHint && (
              <View className="mt-3 p-3 bg-muted rounded-lg">
                <Muted className="text-xs mb-1">Hint</Muted>
                <FormattedText
                  text={subject.readingHint}
                  style={{ fontSize: 14, lineHeight: 20 }}
                />
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

      {/* Visually Similar Kanji - Only for kanji */}
      {subject.type === "kanji" && visuallySimilarSubjects.length > 0 && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Visually Similar Kanji</CardTitle>
          </CardHeader>
          <CardContent>
            <View className="flex-row flex-wrap gap-2">
              {visuallySimilarSubjects.map((similar) => (
                <SubjectChip
                  key={similar.id}
                  subject={similar}
                  size="md"
                  showMeaning
                />
              ))}
            </View>
          </CardContent>
        </Card>
      )}

      {/* Bottom padding */}
      <View className="h-4" />
    </ScrollView>
  )
}
