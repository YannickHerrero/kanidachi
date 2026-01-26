import * as React from "react"
import { ScrollView, View, Pressable } from "react-native"
import { Pencil, Plus } from "lucide-react-native"

import { Text } from "@/components/ui/text"
import { Muted } from "@/components/ui/typography"
import { Separator } from "@/components/ui/separator"
import { ExpandableText } from "@/components/ui/expandable-text"
import { AudioButton } from "@/components/subject/audio-player"
import { RadicalImage, parseCharacterImages } from "@/components/subject/radical-image"
import { StudyMaterialEditor } from "@/components/subject/study-material-editor"
import { parseMeanings, parseReadings, parseContextSentences, parseStringArray } from "@/db/queries"
import { useSettingsStore } from "@/stores/settings"
import { useStudyMaterial, parseMeaningSynonyms } from "@/hooks/useStudyMaterial"
import { useColorScheme } from "@/lib/useColorScheme"
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
  const { colorScheme } = useColorScheme()
  const autoPlayAudio = useSettingsStore((s) => s.autoPlayAudioReviews)
  const meanings = parseMeanings(subject.meanings)
  const readings = parseReadings(subject.readings)
  const contextSentences = parseContextSentences(subject.contextSentences)
  const partsOfSpeech = parseStringArray(subject.partsOfSpeech)

  // Fetch user study material (synonyms and notes)
  const { studyMaterial, refetch: refetchStudyMaterial } = useStudyMaterial(subject.id)
  const userSynonyms = parseMeaningSynonyms(studyMaterial?.meaningSynonyms)

  const editIconColor = colorScheme === "dark" ? "#9ca3af" : "#6b7280"

  // Check if this subject has audio (vocabulary or kana_vocabulary)
  const hasAudio = subject.type === "vocabulary" || subject.type === "kana_vocabulary"

  // Parse character images for radicals without Unicode characters
  const characterImages = parseCharacterImages(subject.characterImages)
  const isImageOnlyRadical = subject.type === "radical" && !subject.characters && characterImages.length > 0

  const primaryMeanings = meanings.filter((m) => m.primary).map((m) => m.meaning)
  const secondaryMeanings = meanings.filter((m) => !m.primary && m.acceptedAnswer).map((m) => m.meaning)

  // Group readings by type for kanji
  const onyomiReadings = readings.filter((r) => r.type === "onyomi")
  const kunyomiReadings = readings.filter((r) => r.type === "kunyomi")
  const vocabReadings = readings.filter((r) => !r.type)

  const typeColor = TYPE_COLORS[subject.type as keyof typeof TYPE_COLORS] ?? TYPE_COLORS.vocabulary

  return (
    <StudyMaterialEditor
      subjectId={subject.id}
      studyMaterial={studyMaterial}
      onSave={refetchStudyMaterial}
    >
      {(openEditor) => (
        <ScrollView
          className="flex-1"
          contentContainerClassName="items-center px-4 pb-4"
          showsVerticalScrollIndicator={false}
        >
          {/* Character with audio button */}
          <View className="relative mb-6">
            <View className={`px-8 py-6 rounded-2xl ${typeColor}`}>
              {isImageOnlyRadical ? (
                <RadicalImage
                  characterImages={characterImages}
                  characters={subject.characters}
                  size="lg"
                  textClassName="text-white"
                />
              ) : (
                <Text className="text-5xl text-white font-semibold">
                  {subject.characters ?? "?"}
                </Text>
              )}
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
            {/* User synonyms with edit button */}
            <View className="flex-row flex-wrap justify-center items-center gap-1 mt-2">
              {userSynonyms.map((synonym, index) => (
                <View key={index} className="bg-blue-500/20 px-2 py-0.5 rounded">
                  <Text className="text-sm text-blue-600 dark:text-blue-400">{synonym}</Text>
                </View>
              ))}
              <Pressable
                onPress={() => openEditor("synonyms")}
                className="flex-row items-center gap-1 px-2 py-0.5 rounded border border-dashed border-muted-foreground/40"
              >
                {userSynonyms.length > 0 ? (
                  <Pencil size={12} color={editIconColor} />
                ) : (
                  <Plus size={12} color={editIconColor} />
                )}
                <Text className="text-xs text-muted-foreground">
                  {userSynonyms.length > 0 ? "Edit" : "Add synonym"}
                </Text>
              </Pressable>
            </View>
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

          {/* Parts of Speech (vocabulary only) */}
          {partsOfSpeech.length > 0 && (
            <View className="w-full mb-4">
              <View className="flex-row flex-wrap gap-2">
                {partsOfSpeech.map((pos, index) => (
                  <View key={index} className="bg-muted px-2 py-1 rounded">
                    <Text className="text-xs text-muted-foreground">{pos}</Text>
                  </View>
                ))}
              </View>
            </View>
          )}

          {/* Mnemonic */}
          {subject.meaningMnemonic && (
            <View className="w-full">
              <Muted className="text-xs mb-2">Mnemonic</Muted>
              <ExpandableText
                text={subject.meaningMnemonic}
                numberOfLines={3}
                className="text-base leading-relaxed"
              />
            </View>
          )}

          {/* Reading mnemonic for kanji/vocab */}
          {subject.readingMnemonic && (
            <View className="w-full mt-4">
              <Muted className="text-xs mb-2">Reading Mnemonic</Muted>
              <ExpandableText
                text={subject.readingMnemonic}
                numberOfLines={3}
                className="text-base leading-relaxed"
              />
            </View>
          )}

          {/* User Meaning Note */}
          <View className="w-full mt-4">
            <View className="flex-row items-center justify-between mb-2">
              <Muted className="text-xs">Your Meaning Note</Muted>
              <Pressable
                onPress={() => openEditor("meaningNote")}
                className="flex-row items-center gap-1"
              >
                {studyMaterial?.meaningNote ? (
                  <Pencil size={12} color={editIconColor} />
                ) : (
                  <Plus size={12} color={editIconColor} />
                )}
                <Text className="text-xs text-muted-foreground">
                  {studyMaterial?.meaningNote ? "Edit" : "Add"}
                </Text>
              </Pressable>
            </View>
            {studyMaterial?.meaningNote ? (
              <View className="bg-blue-500/10 p-3 rounded-lg border border-blue-500/20">
                <Text className="text-base leading-relaxed">{studyMaterial.meaningNote}</Text>
              </View>
            ) : (
              <Muted className="text-sm italic">No meaning note</Muted>
            )}
          </View>

          {/* User Reading Note (only for kanji/vocab with readings) */}
          {readings.length > 0 && (
            <View className="w-full mt-4">
              <View className="flex-row items-center justify-between mb-2">
                <Muted className="text-xs">Your Reading Note</Muted>
                <Pressable
                  onPress={() => openEditor("readingNote")}
                  className="flex-row items-center gap-1"
                >
                  {studyMaterial?.readingNote ? (
                    <Pencil size={12} color={editIconColor} />
                  ) : (
                    <Plus size={12} color={editIconColor} />
                  )}
                  <Text className="text-xs text-muted-foreground">
                    {studyMaterial?.readingNote ? "Edit" : "Add"}
                  </Text>
                </Pressable>
              </View>
              {studyMaterial?.readingNote ? (
                <View className="bg-blue-500/10 p-3 rounded-lg border border-blue-500/20">
                  <Text className="text-base leading-relaxed">{studyMaterial.readingNote}</Text>
                </View>
              ) : (
                <Muted className="text-sm italic">No reading note</Muted>
              )}
            </View>
          )}

          {/* Context Sentences (vocabulary only) */}
          {contextSentences.length > 0 && (
            <View className="w-full mt-4">
              <Muted className="text-xs mb-2">Context Sentences</Muted>
              {contextSentences.slice(0, 2).map((sentence, index) => (
                <View key={index} className={index > 0 ? "mt-3" : ""}>
                  <Text className="text-base leading-relaxed">{sentence.ja}</Text>
                  <Muted className="text-sm mt-1">{sentence.en}</Muted>
                </View>
              ))}
            </View>
          )}
        </ScrollView>
      )}
    </StudyMaterialEditor>
  )
}
