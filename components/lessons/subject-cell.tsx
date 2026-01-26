import * as React from "react"
import { Pressable, View, StyleSheet } from "react-native"
import { Check } from "lucide-react-native"

import { Text } from "@/components/ui/text"
import { InlineRadicalImage, parseCharacterImages } from "@/components/subject/radical-image"
import { parseMeanings } from "@/db/queries"
import type { Subject } from "@/stores/lessons"

// Subject type colors as React Native styles
// Note: Using inline styles instead of NativeWind className to avoid
// NativeWind v4 CSS interop race condition that breaks React Navigation context
// https://github.com/nativewind/nativewind/discussions/1537
const TYPE_STYLES = {
  radical: {
    backgroundColor: "#3b82f6", // blue-500
    borderColor: "#2563eb", // blue-600
  },
  kanji: {
    backgroundColor: "#ec4899", // pink-500
    borderColor: "#db2777", // pink-600
  },
  vocabulary: {
    backgroundColor: "#a855f7", // purple-500
    borderColor: "#9333ea", // purple-600
  },
  kana_vocabulary: {
    backgroundColor: "#a855f7", // purple-500
    borderColor: "#9333ea", // purple-600
  },
} as const

interface SubjectCellProps {
  subject: Subject
  isSelected: boolean
  onToggle: () => void
}

export function SubjectCell({ subject, isSelected, onToggle }: SubjectCellProps) {
  const typeStyle = TYPE_STYLES[subject.type as keyof typeof TYPE_STYLES] ?? TYPE_STYLES.vocabulary

  // Parse character images for radicals without Unicode characters
  const characterImages = parseCharacterImages(subject.characterImages)
  const isImageOnlyRadical = subject.type === "radical" && !subject.characters && characterImages.length > 0

  // Get primary meaning
  const meanings = parseMeanings(subject.meanings)
  const primaryMeaning = meanings.find((m) => m.primary)?.meaning ?? meanings[0]?.meaning ?? ""

  // Truncate long meanings
  const displayMeaning = primaryMeaning.length > 12
    ? `${primaryMeaning.slice(0, 10)}...`
    : primaryMeaning

  return (
    <View style={styles.cellContainer}>
      <Pressable onPress={onToggle} style={styles.pressable}>
        <View
          style={[
            styles.innerContainer,
            typeStyle,
            isSelected && styles.selected,
          ]}
        >
          {/* Selection indicator */}
          {isSelected && (
            <View style={styles.checkIndicator}>
              <Check size={14} color="#000" strokeWidth={3} />
            </View>
          )}

          {/* Character or Radical Image */}
          {isImageOnlyRadical ? (
            <View style={styles.characterContainer}>
              <InlineRadicalImage
                characterImages={characterImages}
                characters={subject.characters}
                size={28}
              />
            </View>
          ) : (
            <Text
              style={styles.characterText}
              numberOfLines={1}
            >
              {subject.characters ?? "?"}
            </Text>
          )}

          {/* Meaning */}
          <Text
            style={styles.meaningText}
            numberOfLines={1}
          >
            {displayMeaning}
          </Text>
        </View>
      </Pressable>
    </View>
  )
}

const styles = StyleSheet.create({
  cellContainer: {
    width: "23%",
    aspectRatio: 1,
    margin: "1%",
  },
  pressable: {
    flex: 1,
  },
  innerContainer: {
    flex: 1,
    borderRadius: 8,
    borderWidth: 2,
    alignItems: "center",
    justifyContent: "center",
    padding: 4,
  },
  selected: {
    // Selection indicator via border instead of ring (ring doesn't work on RN)
    borderWidth: 3,
    borderColor: "#fff",
  },
  checkIndicator: {
    position: "absolute",
    top: 4,
    right: 4,
    width: 20,
    height: 20,
    backgroundColor: "#fff",
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  characterContainer: {
    // Container for radical image - provides white tint context
  },
  characterText: {
    color: "#fff",
    fontSize: 24,
    fontWeight: "600",
  },
  meaningText: {
    color: "rgba(255, 255, 255, 0.8)", // text-white/80 equivalent
    fontSize: 12,
    textAlign: "center",
  },
})
