import * as React from "react"
import { Pressable, View } from "react-native"

import { Card, CardContent } from "@/components/ui/card"
import { CardFront } from "./card-front"
import { CardBack } from "./card-back"
import type { Subject } from "@/stores/reviews"

interface AnkiCardProps {
  subject: Subject
  isFlipped: boolean
  onFlip: () => void
}

export function AnkiCard({ subject, isFlipped, onFlip }: AnkiCardProps) {
  return (
    <Pressable
      onPress={!isFlipped ? onFlip : undefined}
      className="flex-1"
      disabled={isFlipped}
    >
      <Card className="flex-1 mx-4">
        <CardContent className="flex-1 py-6">
          {isFlipped ? (
            <CardBack subject={subject} />
          ) : (
            <CardFront subject={subject} />
          )}
        </CardContent>
      </Card>
    </Pressable>
  )
}
