import * as React from "react"
import { ScrollView, View, Pressable } from "react-native"
import { Pencil, Plus } from "lucide-react-native"

import { Badge } from "@/components/ui/badge"
import { Text } from "@/components/ui/text"
import { Muted } from "@/components/ui/typography"
import { Separator } from "@/components/ui/separator"
import { FormattedText } from "@/components/ui/formatted-text"
import { AudioButton } from "@/components/subject/audio-player"
import { SubjectCharacters } from "@/components/subject/subject-characters"
import { StudyMaterialEditor } from "@/components/subject/study-material-editor"
import { SubjectChip } from "@/components/subject/subject-chip"
import { parseMeanings, parseReadings, parseContextSentences, parseStringArray, parseNumberArray, getSubjectsByIds } from "@/db/queries"
import { useDatabase } from "@/db/provider"
import { useSettingsStore } from "@/stores/settings"
import { useStudyMaterial, parseMeaningSynonyms } from "@/hooks/useStudyMaterial"
import { useThemeColors } from "@/hooks/useThemeColors"
import type { Assignment, Subject } from "@/stores/reviews"

// Subject type colors
const TYPE_COLORS = {
  radical: "bg-blue-500",
  kanji: "bg-pink-500",
  vocabulary: "bg-purple-500",
  kana_vocabulary: "bg-purple-500",
} as const

const SRS_INFO = {
  0: { label: "Locked", color: null },
  1: { label: "Apprentice I", color: "#DD0093" },
  2: { label: "Apprentice II", color: "#DD0093" },
  3: { label: "Apprentice III", color: "#DD0093" },
  4: { label: "Apprentice IV", color: "#DD0093" },
  5: { label: "Guru I", color: "#882D9E" },
  6: { label: "Guru II", color: "#882D9E" },
  7: { label: "Master", color: "#294DDB" },
  8: { label: "Enlightened", color: "#0093DD" },
  9: { label: "Burned", color: "#434343" },
} as const

interface CardBackProps {
  subject: Subject
  assignment: Assignment
}

export function CardBack({ subject, assignment }: CardBackProps) {
  const { db } = useDatabase()
  const colors = useThemeColors()
  const autoPlayAudio = useSettingsStore((s) => s.autoPlayAudioReviews)
  const meanings = parseMeanings(subject.meanings)
  const readings = parseReadings(subject.readings)
  const contextSentences = parseContextSentences(subject.contextSentences)
  const partsOfSpeech = parseStringArray(subject.partsOfSpeech)

  // Fetch user study material (synonyms and notes)
  const { studyMaterial, refetch: refetchStudyMaterial } = useStudyMaterial(subject.id)
  const userSynonyms = parseMeaningSynonyms(studyMaterial?.meaningSynonyms)

  const editIconColor = colors.mutedForeground

  // Parse related subject IDs
  const componentSubjectIds = parseNumberArray(subject.componentSubjectIds)
  const visuallySimilarIds = parseNumberArray(subject.visuallySimilarSubjectIds)
  const amalgamationIds = parseNumberArray(subject.amalgamationSubjectIds)

  // State for related subjects
  const [componentSubjects, setComponentSubjects] = React.useState<Subject[]>([])
  const [visuallySimilarSubjects, setVisuallySimilarSubjects] = React.useState<Subject[]>([])
  const [amalgamationSubjects, setAmalgamationSubjects] = React.useState<Subject[]>([])

  // Fetch component subjects (radicals for kanji, kanji for vocab)
  React.useEffect(() => {
    if (db && componentSubjectIds.length > 0) {
      getSubjectsByIds(db, componentSubjectIds).then(setComponentSubjects)
    } else {
      setComponentSubjects([])
    }
  }, [db, subject.id])

  // Fetch visually similar kanji (kanji only)
  React.useEffect(() => {
    if (db && visuallySimilarIds.length > 0 && subject.type === "kanji") {
      getSubjectsByIds(db, visuallySimilarIds).then(setVisuallySimilarSubjects)
    } else {
      setVisuallySimilarSubjects([])
    }
  }, [db, subject.id, subject.type])

  // Fetch amalgamation subjects (found in kanji / used in vocabulary)
  React.useEffect(() => {
    if (db && amalgamationIds.length > 0) {
      getSubjectsByIds(db, amalgamationIds).then(setAmalgamationSubjects)
    } else {
      setAmalgamationSubjects([])
    }
  }, [db, subject.id])

  // Check if this subject has audio (vocabulary or kana_vocabulary)
  const hasAudio = subject.type === "vocabulary" || subject.type === "kana_vocabulary"

  const primaryMeanings = meanings.filter((m) => m.primary).map((m) => m.meaning)
  const secondaryMeanings = meanings.filter((m) => !m.primary && m.acceptedAnswer).map((m) => m.meaning)

  // Group readings by type for kanji
  const onyomiReadings = readings.filter((r) => r.type === "onyomi")
  const kunyomiReadings = readings.filter((r) => r.type === "kunyomi")
  const vocabReadings = readings.filter((r) => !r.type)

  const typeColor = TYPE_COLORS[subject.type as keyof typeof TYPE_COLORS] ?? TYPE_COLORS.vocabulary

  const srsStage = assignment?.srsStage ?? 0
  const srsInfo = SRS_INFO[srsStage as keyof typeof SRS_INFO] ?? SRS_INFO[0]
  const nextSrsInfo = SRS_INFO[(srsStage + 1) as keyof typeof SRS_INFO]
  const isStarted = assignment?.startedAt !== null
  const srsBackgroundColor = srsStage === 0 ? colors.muted : srsInfo.color ?? colors.muted
  const srsTextStyle = srsStage === 0 ? { color: colors.mutedForeground } : { color: "#ffffff" }
  const srsPassesText = srsStage === 0
    ? "Lesson required"
    : srsStage >= 9
      ? "Max stage"
      : `1 pass to ${nextSrsInfo?.label ?? "next stage"}`

  // Determine section titles based on subject type
  const componentTitle = subject.type === "kanji"
    ? "Radicals Used"
    : subject.type === "vocabulary" || subject.type === "kana_vocabulary"
      ? "Kanji Used"
      : "Components"

  const amalgamationTitle = subject.type === "radical"
    ? "Found in Kanji"
    : subject.type === "kanji"
      ? "Used in Vocabulary"
      : "Related Items"

  // Check if we have any related subject sections to display
  const hasRelatedSections = componentSubjects.length > 0 ||
    visuallySimilarSubjects.length > 0 ||
    amalgamationSubjects.length > 0

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
              <SubjectCharacters subject={subject} size="lg" textClassName="text-white" />
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

          {isStarted && (
            <View className="items-center mb-4">
              <Muted className="text-xs mb-1">SRS Stage</Muted>
              <Badge variant="outline" style={{ backgroundColor: srsBackgroundColor, borderColor: "transparent" }}>
                <Text className="text-xs" style={srsTextStyle}>
                  {srsInfo.label}
                </Text>
              </Badge>
              <Muted className="text-xs mt-1">{srsPassesText}</Muted>
            </View>
          )}

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
                  <Text
                    className="text-sm"
                    style={{ color: colors.background === '#0a0a0b' ? '#60a5fa' : '#2563eb' }}
                  >
                    {synonym}
                  </Text>
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

          {/* Component Subjects (Radicals Used / Kanji Used) */}
          {componentSubjects.length > 0 && (
            <View className="w-full mb-4">
              <Muted className="text-xs mb-2">{componentTitle}</Muted>
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
            </View>
          )}

          {/* Visually Similar Kanji (kanji only) */}
          {subject.type === "kanji" && visuallySimilarSubjects.length > 0 && (
            <View className="w-full mb-4">
              <Muted className="text-xs mb-2">Visually Similar Kanji</Muted>
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
            </View>
          )}

          {/* Amalgamations (Found in Kanji / Used in Vocabulary) */}
          {amalgamationSubjects.length > 0 && (
            <View className="w-full mb-4">
              <Muted className="text-xs mb-2">{amalgamationTitle}</Muted>
              <View className="flex-row flex-wrap gap-2">
                {amalgamationSubjects.slice(0, 20).map((item) => (
                  <SubjectChip
                    key={item.id}
                    subject={item}
                    size="md"
                    showMeaning
                  />
                ))}
              </View>
              {amalgamationSubjects.length > 20 && (
                <Muted className="text-sm mt-2">
                  +{amalgamationSubjects.length - 20} more...
                </Muted>
              )}
            </View>
          )}

          {/* Separator before mnemonics if we had related sections */}
          {hasRelatedSections && <Separator className="my-4 w-full" />}

          {/* Parts of Speech (vocabulary only) */}
          {partsOfSpeech.length > 0 && (
            <View className="w-full mb-4">
              <View className="flex-row flex-wrap gap-2">
                {partsOfSpeech.map((pos, index) => (
                  <View key={index} className="px-2 py-1 rounded" style={{ backgroundColor: colors.muted }}>
                    <Text className="text-xs" style={{ color: colors.mutedForeground }}>{pos}</Text>
                  </View>
                ))}
              </View>
            </View>
          )}

          {/* Mnemonic */}
          {subject.meaningMnemonic && (
            <View className="w-full">
              <Muted className="text-xs mb-2">Mnemonic</Muted>
              <FormattedText
                text={subject.meaningMnemonic}
                expandable
                collapsedLines={3}
              />
              {subject.meaningHint && (
                <View className="mt-3 p-3 rounded-lg" style={{ backgroundColor: colors.muted }}>
                  <Muted className="text-xs mb-1">Hint</Muted>
                  <FormattedText
                    text={subject.meaningHint}
                    style={{ fontSize: 14, lineHeight: 20 }}
                  />
                </View>
              )}
            </View>
          )}

          {/* Reading mnemonic for kanji/vocab */}
          {subject.readingMnemonic && (
            <View className="w-full mt-4">
              <Muted className="text-xs mb-2">Reading Mnemonic</Muted>
              <FormattedText
                text={subject.readingMnemonic}
                expandable
                collapsedLines={3}
              />
              {subject.readingHint && (
                <View className="mt-3 p-3 rounded-lg" style={{ backgroundColor: colors.muted }}>
                  <Muted className="text-xs mb-1">Hint</Muted>
                  <FormattedText
                    text={subject.readingHint}
                    style={{ fontSize: 14, lineHeight: 20 }}
                  />
                </View>
              )}
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
