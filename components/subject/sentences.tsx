import * as React from "react"
import { View } from "react-native"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Text } from "@/components/ui/text"
import { Muted } from "@/components/ui/typography"
import { Separator } from "@/components/ui/separator"
import { parseContextSentences } from "@/db/queries"
import type { subjects } from "@/db/schema"

type Subject = typeof subjects.$inferSelect

interface SentencesProps {
  subject: Subject
}

export function Sentences({ subject }: SentencesProps) {
  const sentences = parseContextSentences(subject.contextSentences)

  // Only show for vocabulary
  if (subject.type !== "vocabulary" && subject.type !== "kana_vocabulary") {
    return null
  }

  if (sentences.length === 0) {
    return null
  }

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-base">Context Sentences</CardTitle>
      </CardHeader>
      <CardContent className="gap-4">
        {sentences.map((sentence, index) => (
          <View key={index}>
            {index > 0 && <Separator className="mb-4" />}
            <Text className="text-base mb-1">{sentence.ja}</Text>
            <Muted className="text-sm">{sentence.en}</Muted>
          </View>
        ))}
      </CardContent>
    </Card>
  )
}
