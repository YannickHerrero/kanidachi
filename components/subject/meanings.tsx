import * as React from "react"
import { View } from "react-native"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Text } from "@/components/ui/text"
import { Muted } from "@/components/ui/typography"
import { useThemeColors } from "@/hooks/useThemeColors"
import { parseMeanings, parseStringArray } from "@/db/queries"
import type { subjects, studyMaterials } from "@/db/schema"

type Subject = typeof subjects.$inferSelect
type StudyMaterial = typeof studyMaterials.$inferSelect

interface MeaningsProps {
  subject: Subject
  studyMaterial: StudyMaterial | null
}

export function Meanings({ subject, studyMaterial }: MeaningsProps) {
  const colors = useThemeColors()
  const meanings = parseMeanings(subject.meanings)

  const primaryMeanings = meanings
    .filter((m) => m.primary)
    .map((m) => m.meaning)

  const secondaryMeanings = meanings
    .filter((m) => !m.primary && m.acceptedAnswer)
    .map((m) => m.meaning)

  // User synonyms from study material
  const userSynonyms = studyMaterial
    ? parseStringArray(studyMaterial.meaningSynonyms)
    : []

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-base">Meanings</CardTitle>
      </CardHeader>
      <CardContent className="gap-2">
        {/* Primary meanings */}
        <Text className="text-lg font-medium">
          {primaryMeanings.join(", ")}
        </Text>

        {/* Secondary meanings */}
        {secondaryMeanings.length > 0 && (
          <View>
            <Muted className="text-xs mb-1">Alternative meanings</Muted>
            <Text className="text-base" style={{ color: colors.mutedForeground }}>
              {secondaryMeanings.join(", ")}
            </Text>
          </View>
        )}

        {/* User synonyms */}
        {userSynonyms.length > 0 && (
          <View>
            <Muted className="text-xs mb-1">Your synonyms</Muted>
            <Text className="text-base text-blue-500">
              {userSynonyms.join(", ")}
            </Text>
          </View>
        )}
      </CardContent>
    </Card>
  )
}
