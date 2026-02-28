import * as React from "react"
import { Pressable, View } from "react-native"

import { Card, CardContent } from "@/components/ui/card"
import { CardFront } from "./card-front"
import { CardBack } from "./card-back"
import { FlashcardFront } from "./flashcard-front"
import { FlashcardBack } from "./flashcard-back"
import type { Assignment, Subject } from "@/stores/reviews"

interface AnkiCardProps {
  subject: Subject
  assignment: Assignment
  source?: "wanikani" | "flashcard"
  isFlipped: boolean
  onFlip: () => void
}

export function AnkiCard({ subject, assignment, source, isFlipped, onFlip }: AnkiCardProps) {
  const isFlashcard = source === "flashcard"

  return (
    <Pressable
      onPress={!isFlipped ? onFlip : undefined}
      className="flex-1"
      disabled={isFlipped}
    >
      <Card className="flex-1 mx-4">
        <CardContent className="flex-1 py-6">
          {isFlipped ? (
            isFlashcard ? (
              <FlashcardBack subject={subject} />
            ) : (
              <CardBack subject={subject} assignment={assignment} />
            )
          ) : (
            isFlashcard ? <FlashcardFront subject={subject} /> : <CardFront subject={subject} />
          )}
        </CardContent>
      </Card>
    </Pressable>
  )
}
