import * as React from "react"
import { View } from "react-native"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { SubjectChip } from "./subject-chip"
import type { subjects } from "@/db/schema"

type Subject = typeof subjects.$inferSelect

interface VisuallySimilarProps {
  subject: Subject
  visuallySimilarSubjects: Subject[]
}

export function VisuallySimilar({ subject, visuallySimilarSubjects }: VisuallySimilarProps) {
  // Only show for kanji
  if (subject.type !== "kanji" || visuallySimilarSubjects.length === 0) {
    return null
  }

  return (
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
  )
}
