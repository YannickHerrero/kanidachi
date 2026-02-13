import * as React from "react"
import { View } from "react-native"

import { cn } from "@/lib/utils"
import { Meanings } from "@/components/subject/meanings"
import { Readings } from "@/components/subject/readings"
import { MeaningMnemonic, ReadingMnemonic } from "@/components/subject/mnemonic"
import { Components } from "@/components/subject/components"
import { Amalgamations } from "@/components/subject/amalgamations"
import { VisuallySimilar } from "@/components/subject/visually-similar"
import { Sentences } from "@/components/subject/sentences"
import { PartsOfSpeech } from "@/components/subject/parts-of-speech"
import { UserNotes } from "@/components/subject/user-notes"
import { AudioPlayer } from "@/components/subject/audio-player"
import type { Subject, StudyMaterial } from "@/hooks/useSubject"

interface SubjectDetailContentProps {
  subject: Subject
  studyMaterial: StudyMaterial | null
  componentSubjects: Subject[]
  amalgamationSubjects: Subject[]
  visuallySimilarSubjects: Subject[]
  className?: string
  showBottomPadding?: boolean
}

export function SubjectDetailContent({
  subject,
  studyMaterial,
  componentSubjects,
  amalgamationSubjects,
  visuallySimilarSubjects,
  className,
  showBottomPadding = true,
}: SubjectDetailContentProps) {
  return (
    <View className={cn("p-4 gap-4", className)}>
      <Meanings subject={subject} studyMaterial={studyMaterial} />
      <Readings subject={subject} />
      <AudioPlayer subject={subject} />
      <PartsOfSpeech subject={subject} />
      <Components subject={subject} componentSubjects={componentSubjects} />
      <MeaningMnemonic subject={subject} studyMaterial={studyMaterial} />
      <ReadingMnemonic subject={subject} studyMaterial={studyMaterial} />
      <VisuallySimilar
        subject={subject}
        visuallySimilarSubjects={visuallySimilarSubjects}
      />
      <Amalgamations subject={subject} amalgamationSubjects={amalgamationSubjects} />
      <Sentences subject={subject} />
      <UserNotes studyMaterial={studyMaterial} />
      {showBottomPadding && <View className="h-8" />}
    </View>
  )
}
