import * as React from "react"
import { View } from "react-native"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Text } from "@/components/ui/text"
import { Muted } from "@/components/ui/typography"
import type { studyMaterials } from "@/db/schema"

type StudyMaterial = typeof studyMaterials.$inferSelect

interface UserNotesProps {
  studyMaterial: StudyMaterial | null
}

export function UserNotes({ studyMaterial }: UserNotesProps) {
  if (!studyMaterial) {
    return null
  }

  const hasMeaningNote = studyMaterial.meaningNote && studyMaterial.meaningNote.trim()
  const hasReadingNote = studyMaterial.readingNote && studyMaterial.readingNote.trim()

  if (!hasMeaningNote && !hasReadingNote) {
    return null
  }

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-base">Your Notes</CardTitle>
      </CardHeader>
      <CardContent className="gap-3">
        {hasMeaningNote && (
          <View>
            <Muted className="text-xs mb-1">Meaning Note</Muted>
            <Text className="text-base">{studyMaterial.meaningNote}</Text>
          </View>
        )}

        {hasReadingNote && (
          <View>
            <Muted className="text-xs mb-1">Reading Note</Muted>
            <Text className="text-base">{studyMaterial.readingNote}</Text>
          </View>
        )}
      </CardContent>
    </Card>
  )
}
