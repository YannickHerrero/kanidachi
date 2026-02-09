import * as React from "react"
import type { TextStyle } from "react-native"

import { Text } from "@/components/ui/text"
import {
  InlineRadicalImage,
  RadicalImage,
  parseCharacterImages,
} from "@/components/subject/radical-image"
import { cn } from "@/lib/utils"

type SubjectLike = {
  type: string
  characters: string | null
  characterImages: string | null
}

type SubjectCharacterSize = "md" | "lg" | "xl" | "2xl"
type SubjectCharacterVariant = "display" | "inline"

function normalizeCharacters(characters: string | null): string {
  const raw = characters ?? "?"
  const cleaned = raw.replace(/[\u0000-\u001F\u007F]/g, "")
  return cleaned.length > 0 ? cleaned : raw
}

const SIZE_CONFIG: Record<
  SubjectCharacterSize,
  { fontSize: number; lineHeight: number; image: "lg" | "xl" }
> = {
  md: { fontSize: 36, lineHeight: 48, image: "lg" },
  lg: { fontSize: 48, lineHeight: 60, image: "lg" },
  xl: { fontSize: 60, lineHeight: 72, image: "xl" },
  "2xl": { fontSize: 72, lineHeight: 84, image: "xl" },
}

interface SubjectCharactersProps {
  subject: SubjectLike
  size?: SubjectCharacterSize
  variant?: SubjectCharacterVariant
  textClassName?: string
  textStyle?: TextStyle
  lineHeight?: number
  inlineSize?: number
  inlineLineHeight?: number
  imageSize?: number
}

export function SubjectCharacters({
  subject,
  size = "xl",
  variant = "display",
  textClassName,
  textStyle,
  lineHeight,
  inlineSize,
  inlineLineHeight,
  imageSize,
}: SubjectCharactersProps) {
  const sizeConfig = SIZE_CONFIG[size]
  const characterImages = parseCharacterImages(subject.characterImages)
  const isImageOnlyRadical =
    subject.type === "radical" && !subject.characters && characterImages.length > 0

  if (variant === "inline") {
    const inlineFontSize = inlineSize ?? 16
    const resolvedLineHeight = inlineLineHeight ?? Math.round(inlineFontSize * 1.25)

    if (isImageOnlyRadical) {
      return (
        <InlineRadicalImage
          characterImages={characterImages}
          characters={subject.characters}
          size={imageSize ?? inlineFontSize}
          className={textClassName}
        />
      )
    }

    const characters = normalizeCharacters(subject.characters)
    const characterCount = Array.from(characters).length
    const inlineScale = characterCount > 1 ? 0.8 : 1
    const resolvedFontSize = Math.round(inlineFontSize * inlineScale)
    const resolvedInlineLineHeight = Math.round(resolvedLineHeight * inlineScale)

    return (
      <Text
        className={cn("font-semibold", textClassName)}
        style={[
          {
            fontSize: resolvedFontSize,
            lineHeight: resolvedInlineLineHeight,
            textAlign: "center",
          },
          textStyle,
        ]}
        numberOfLines={1}
      >
        {characters}
      </Text>
    )
  }

  if (isImageOnlyRadical) {
    return (
      <RadicalImage
        characterImages={characterImages}
        characters={subject.characters}
        size={sizeConfig.image}
        textClassName={textClassName}
      />
    )
  }

  const characters = normalizeCharacters(subject.characters)
  const characterCount = Array.from(characters).length
  const displayScale = characterCount > 1
    ? Math.max(0.6, 1 - (characterCount - 1) * 0.15)
    : 1
  const baseLineHeight = lineHeight ?? sizeConfig.lineHeight
  const resolvedFontSize = Math.round(sizeConfig.fontSize * displayScale)
  const resolvedLineHeight = Math.round(baseLineHeight * displayScale)

  return (
    <Text
      className={cn("font-semibold", textClassName)}
      style={[
        {
          fontSize: resolvedFontSize,
          lineHeight: resolvedLineHeight,
          textAlign: "center",
        },
        textStyle,
      ]}
      numberOfLines={1}
      adjustsFontSizeToFit
      minimumFontScale={0.6}
    >
      {characters}
    </Text>
  )
}
