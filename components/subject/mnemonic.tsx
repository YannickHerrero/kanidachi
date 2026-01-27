import * as React from "react"
import { View, Pressable } from "react-native"
import { ChevronDown, ChevronUp } from "lucide-react-native"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Text } from "@/components/ui/text"
import { Muted } from "@/components/ui/typography"
import { FormattedText } from "@/components/ui/formatted-text"
import { useColorScheme } from "@/lib/useColorScheme"
import type { subjects, studyMaterials } from "@/db/schema"

type Subject = typeof subjects.$inferSelect
type StudyMaterial = typeof studyMaterials.$inferSelect

interface MnemonicProps {
  title: string
  mnemonic: string | null
  hint?: string | null
  userNote?: string | null
}

export function Mnemonic({ title, mnemonic, hint, userNote }: MnemonicProps) {
  const { colorScheme } = useColorScheme()
  const [showHint, setShowHint] = React.useState(false)

  if (!mnemonic) {
    return null
  }

  const iconColor = colorScheme === "dark" ? "#a1a1aa" : "#71717a"

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-base">{title}</CardTitle>
      </CardHeader>
      <CardContent className="gap-3">
        {/* Mnemonic text with rich formatting */}
        <FormattedText text={mnemonic} />

        {/* Hint (collapsible) */}
        {hint && (
          <Pressable
            onPress={() => setShowHint(!showHint)}
            className="flex-row items-center gap-1"
          >
            {showHint ? (
              <ChevronUp size={16} color={iconColor} />
            ) : (
              <ChevronDown size={16} color={iconColor} />
            )}
            <Muted className="text-sm">
              {showHint ? "Hide hint" : "Show hint"}
            </Muted>
          </Pressable>
        )}

        {showHint && hint && (
          <View className="p-3 bg-muted rounded-lg">
            <FormattedText text={hint} style={{ fontSize: 14, lineHeight: 20 }} />
          </View>
        )}

        {/* User note */}
        {userNote && (
          <View className="p-3 bg-blue-500/10 rounded-lg border border-blue-500/20">
            <Muted className="text-xs mb-1">Your note</Muted>
            <Text className="text-sm">{userNote}</Text>
          </View>
        )}
      </CardContent>
    </Card>
  )
}

// Convenience component for meaning mnemonic
interface MeaningMnemonicProps {
  subject: Subject
  studyMaterial: StudyMaterial | null
}

export function MeaningMnemonic({ subject, studyMaterial }: MeaningMnemonicProps) {
  return (
    <Mnemonic
      title="Meaning Mnemonic"
      mnemonic={subject.meaningMnemonic}
      hint={subject.meaningHint}
      userNote={studyMaterial?.meaningNote}
    />
  )
}

// Convenience component for reading mnemonic
interface ReadingMnemonicProps {
  subject: Subject
  studyMaterial: StudyMaterial | null
}

export function ReadingMnemonic({ subject, studyMaterial }: ReadingMnemonicProps) {
  if (subject.type === "radical") {
    return null
  }

  return (
    <Mnemonic
      title="Reading Mnemonic"
      mnemonic={subject.readingMnemonic}
      hint={subject.readingHint}
      userNote={studyMaterial?.readingNote}
    />
  )
}
