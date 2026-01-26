import * as React from "react"
import { View, Pressable, Text as RNText, StyleSheet } from "react-native"
import { ChevronDown, ChevronUp } from "lucide-react-native"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Text } from "@/components/ui/text"
import { Muted } from "@/components/ui/typography"
import { useColorScheme } from "@/lib/useColorScheme"
import type { subjects, studyMaterials } from "@/db/schema"

type Subject = typeof subjects.$inferSelect
type StudyMaterial = typeof studyMaterials.$inferSelect

// Tag types for mnemonic formatting
type TagType = "radical" | "kanji" | "vocabulary" | "reading" | "ja" | "text"

interface MnemonicSegment {
  type: TagType
  content: string
}

// Colors for different tag types
const TAG_COLORS = {
  radical: { bg: "#0093DD", text: "#fff" },
  kanji: { bg: "#DD0093", text: "#fff" },
  vocabulary: { bg: "#9300DD", text: "#fff" },
  reading: { bg: "#555", text: "#fff" },
  ja: { bg: "transparent", text: "inherit" },
  text: { bg: "transparent", text: "inherit" },
} as const

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
  const textColor = colorScheme === "dark" ? "#e4e4e7" : "#27272a"

  // Parse mnemonic into segments
  const segments = parseMnemonic(mnemonic)

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-base">{title}</CardTitle>
      </CardHeader>
      <CardContent className="gap-3">
        {/* Mnemonic text with rich formatting */}
        <RNText style={[styles.mnemonicText, { color: textColor }]}>
          {segments.map((segment, index) => (
            <MnemonicSegmentView
              key={index}
              segment={segment}
              textColor={textColor}
            />
          ))}
        </RNText>

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
            <RNText style={[styles.hintText, { color: textColor }]}>
              {parseMnemonic(hint).map((segment, index) => (
                <MnemonicSegmentView
                  key={index}
                  segment={segment}
                  textColor={textColor}
                />
              ))}
            </RNText>
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

// Component to render a single segment
function MnemonicSegmentView({
  segment,
  textColor,
}: {
  segment: MnemonicSegment
  textColor: string
}) {
  if (segment.type === "text" || segment.type === "ja") {
    return <RNText>{segment.content}</RNText>
  }

  const colors = TAG_COLORS[segment.type]

  return (
    <RNText
      style={[
        styles.highlightedText,
        { backgroundColor: colors.bg, color: colors.text },
      ]}
    >
      {segment.content}
    </RNText>
  )
}

// Parse mnemonic text into segments with tag information
function parseMnemonic(text: string): MnemonicSegment[] {
  const segments: MnemonicSegment[] = []

  // Handle line breaks first
  const withLineBreaks = text.replace(/<br\s*\/?>/gi, "\n")

  // Regex to match all tag types
  const tagRegex =
    /<(radical|kanji|vocabulary|reading|ja)>(.*?)<\/\1>/gi

  let lastIndex = 0
  let match: RegExpExecArray | null

  while ((match = tagRegex.exec(withLineBreaks)) !== null) {
    // Add text before this match
    if (match.index > lastIndex) {
      const textBefore = withLineBreaks.slice(lastIndex, match.index)
      if (textBefore) {
        segments.push({
          type: "text",
          content: stripOtherTags(textBefore),
        })
      }
    }

    // Add the matched tag content
    const tagType = match[1].toLowerCase() as TagType
    segments.push({
      type: tagType,
      content: match[2],
    })

    lastIndex = match.index + match[0].length
  }

  // Add remaining text after last match
  if (lastIndex < withLineBreaks.length) {
    const textAfter = withLineBreaks.slice(lastIndex)
    if (textAfter) {
      segments.push({
        type: "text",
        content: stripOtherTags(textAfter),
      })
    }
  }

  // If no segments were created, return the whole text as a single segment
  if (segments.length === 0) {
    return [{ type: "text", content: stripOtherTags(withLineBreaks) }]
  }

  return segments
}

// Strip any remaining HTML tags that we don't handle
function stripOtherTags(text: string): string {
  return text.replace(/<[^>]*>/g, "").trim()
}

const styles = StyleSheet.create({
  mnemonicText: {
    fontSize: 16,
    lineHeight: 24,
  },
  hintText: {
    fontSize: 14,
    lineHeight: 20,
  },
  highlightedText: {
    paddingHorizontal: 4,
    paddingVertical: 1,
    borderRadius: 4,
    overflow: "hidden",
  },
})

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
