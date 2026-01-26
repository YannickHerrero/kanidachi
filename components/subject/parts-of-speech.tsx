import * as React from "react"
import { View } from "react-native"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Text } from "@/components/ui/text"
import { parseStringArray } from "@/db/queries"
import type { subjects } from "@/db/schema"

type Subject = typeof subjects.$inferSelect

interface PartsOfSpeechProps {
  subject: Subject
}

export function PartsOfSpeech({ subject }: PartsOfSpeechProps) {
  const partsOfSpeech = parseStringArray(subject.partsOfSpeech)

  // Only show for vocabulary
  if (subject.type !== "vocabulary" && subject.type !== "kana_vocabulary") {
    return null
  }

  if (partsOfSpeech.length === 0) {
    return null
  }

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-base">Part of Speech</CardTitle>
      </CardHeader>
      <CardContent>
        <View className="flex-row flex-wrap gap-2">
          {partsOfSpeech.map((pos, index) => (
            <Badge key={index} variant="secondary">
              <Text className="text-xs">{pos}</Text>
            </Badge>
          ))}
        </View>
      </CardContent>
    </Card>
  )
}
