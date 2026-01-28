import * as React from "react"
import { View } from "react-native"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Text } from "@/components/ui/text"
import { SubjectChip } from "./subject-chip"
import { useThemeColors } from "@/hooks/useThemeColors"
import type { subjects } from "@/db/schema"

type Subject = typeof subjects.$inferSelect

interface AmalgamationsProps {
  subject: Subject
  amalgamationSubjects: Subject[]
}

export function Amalgamations({ subject, amalgamationSubjects }: AmalgamationsProps) {
  const colors = useThemeColors()

  if (amalgamationSubjects.length === 0) {
    return null
  }

  // Determine title based on subject type
  const title = subject.type === "radical"
    ? "Found in Kanji"
    : subject.type === "kanji"
      ? "Used in Vocabulary"
      : "Related Items"

  // Limit display to first 20 items to avoid huge lists
  const displaySubjects = amalgamationSubjects.slice(0, 20)
  const hasMore = amalgamationSubjects.length > 20

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-base">{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <View className="flex-row flex-wrap gap-2">
          {displaySubjects.map((item) => (
            <SubjectChip
              key={item.id}
              subject={item}
              size="md"
              showMeaning
            />
          ))}
        </View>
        {hasMore && (
          <Text className="text-sm mt-2" style={{ color: colors.mutedForeground }}>
            +{amalgamationSubjects.length - 20} more...
          </Text>
        )}
      </CardContent>
    </Card>
  )
}
