import * as React from "react"
import { View } from "react-native"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Text } from "@/components/ui/text"
import { SubjectChip } from "./subject-chip"
import type { subjects } from "@/db/schema"

type Subject = typeof subjects.$inferSelect

interface ComponentsProps {
  subject: Subject
  componentSubjects: Subject[]
}

export function Components({ subject, componentSubjects }: ComponentsProps) {
  if (componentSubjects.length === 0) {
    return null
  }

  // Determine title based on subject type
  const title = subject.type === "kanji" 
    ? "Radicals Used" 
    : subject.type === "vocabulary" || subject.type === "kana_vocabulary"
      ? "Kanji Used"
      : "Components"

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-base">{title}</CardTitle>
      </CardHeader>
      <CardContent>
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
      </CardContent>
    </Card>
  )
}
