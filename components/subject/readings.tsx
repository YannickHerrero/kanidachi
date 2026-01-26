import * as React from "react"
import { View } from "react-native"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Text } from "@/components/ui/text"
import { Muted } from "@/components/ui/typography"
import { parseReadings } from "@/db/queries"
import type { subjects } from "@/db/schema"

type Subject = typeof subjects.$inferSelect

interface ReadingsProps {
  subject: Subject
}

export function Readings({ subject }: ReadingsProps) {
  const readings = parseReadings(subject.readings)
  
  if (readings.length === 0) {
    return null
  }

  // Group readings by type for kanji
  const onyomiReadings = readings.filter((r) => r.type === "onyomi")
  const kunyomiReadings = readings.filter((r) => r.type === "kunyomi")
  const nanoriReadings = readings.filter((r) => r.type === "nanori")
  const vocabReadings = readings.filter((r) => !r.type)

  const isKanji = subject.type === "kanji"

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-base">Readings</CardTitle>
      </CardHeader>
      <CardContent className="gap-3">
        {/* Kanji readings */}
        {isKanji && (
          <>
            {onyomiReadings.length > 0 && (
              <View>
                <Muted className="text-xs mb-1">On'yomi</Muted>
                <Text className="text-lg">
                  {onyomiReadings.map((r) => r.reading).join(", ")}
                </Text>
              </View>
            )}
            
            {kunyomiReadings.length > 0 && (
              <View>
                <Muted className="text-xs mb-1">Kun'yomi</Muted>
                <Text className="text-lg">
                  {kunyomiReadings.map((r) => r.reading).join(", ")}
                </Text>
              </View>
            )}

            {nanoriReadings.length > 0 && (
              <View>
                <Muted className="text-xs mb-1">Nanori (name reading)</Muted>
                <Text className="text-lg text-muted-foreground">
                  {nanoriReadings.map((r) => r.reading).join(", ")}
                </Text>
              </View>
            )}
          </>
        )}

        {/* Vocabulary readings */}
        {vocabReadings.length > 0 && (
          <Text className="text-lg">
            {vocabReadings.map((r) => r.reading).join(", ")}
          </Text>
        )}
      </CardContent>
    </Card>
  )
}
