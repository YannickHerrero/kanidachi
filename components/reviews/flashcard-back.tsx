import * as React from "react"
import { View } from "react-native"
import { Volume2 } from "lucide-react-native"

import { Button } from "@/components/ui/button"
import { Text } from "@/components/ui/text"
import { Muted } from "@/components/ui/typography"
import { SubjectChip } from "@/components/subject/subject-chip"
import {
  getSubjectsByIds,
  parseContextSentences,
  parseMeanings,
  parsePronunciationAudios,
  parseReadings,
} from "@/db/queries"
import { useDatabase } from "@/db/provider"
import { useThemeColors } from "@/hooks/useThemeColors"
import { audioPlayer } from "@/lib/audio/player"
import type { Subject } from "@/stores/reviews"

interface FlashcardBackProps {
  subject: Subject
}

export function FlashcardBack({ subject }: FlashcardBackProps) {
  const colors = useThemeColors()
  const { db } = useDatabase()
  const meanings = parseMeanings(subject.meanings)
  const readings = parseReadings(subject.readings)
  const sentence = parseContextSentences(subject.contextSentences)[0]
  const audios = parsePronunciationAudios(subject.pronunciationAudios)
  const [componentSubjects, setComponentSubjects] = React.useState<Subject[]>([])

  const componentIds = React.useMemo(() => {
    if (!subject.componentSubjectIds) return []
    try {
      const parsed = JSON.parse(subject.componentSubjectIds) as number[]
      return Array.isArray(parsed) ? parsed : []
    } catch {
      return []
    }
  }, [subject.componentSubjectIds])

  React.useEffect(() => {
    let isActive = true

    const loadComponents = async () => {
      if (!db || componentIds.length === 0) {
        setComponentSubjects([])
        return
      }

      const subjects = await getSubjectsByIds(db, componentIds)
      if (isActive) {
        setComponentSubjects(subjects)
      }
    }

    loadComponents()

    return () => {
      isActive = false
    }
  }, [componentIds, db])

  const wordTranslation = meanings.find((m) => m.primary)?.meaning ?? meanings[0]?.meaning ?? ""
  const wordReading = readings.find((r) => r.primary)?.reading ?? readings[0]?.reading ?? ""
  const wordAudio = audios.find((audio) => audio.metadata.sourceId === 0)?.url
  const sentenceAudio = audios.find((audio) => audio.metadata.sourceId === 1)?.url

  return (
    <View className="flex-1 px-2 items-center justify-center gap-5">
      <View className="w-full gap-1">
        <Muted className="text-xs">Word</Muted>
        <Text className="text-2xl font-semibold">{subject.characters}</Text>
        {wordReading ? <Text className="text-base">{wordReading}</Text> : null}
        <Text style={{ color: colors.mutedForeground }}>{wordTranslation}</Text>
      </View>

      <View className="w-full gap-1">
        <Muted className="text-xs">Sentence</Muted>
        <Text className="text-xl leading-8">{sentence?.ja ?? ""}</Text>
        {sentence?.en ? (
          <Text className="text-base" style={{ color: colors.mutedForeground }}>
            {sentence.en}
          </Text>
        ) : null}
      </View>

      {componentSubjects.length > 0 && (
        <View className="w-full gap-2">
          <Muted className="text-xs">Kanji Used</Muted>
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

      <View className="w-full flex-row gap-2">
        <Button
          variant="outline"
          className="flex-1"
          onPress={() => wordAudio && audioPlayer.play(wordAudio)}
          disabled={!wordAudio}
        >
          <View className="flex-row items-center gap-2">
            <Volume2 size={16} color={colors.foreground} />
            <Text>Word Audio</Text>
          </View>
        </Button>
        <Button
          variant="outline"
          className="flex-1"
          onPress={() => sentenceAudio && audioPlayer.play(sentenceAudio)}
          disabled={!sentenceAudio}
        >
          <View className="flex-row items-center gap-2">
            <Volume2 size={16} color={colors.foreground} />
            <Text>Sentence Audio</Text>
          </View>
        </Button>
      </View>
    </View>
  )
}
