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

const SIZE_CONFIG: Record<SubjectCharacterSize, { text: string; lineHeight: number; image: "lg" | "xl" }> = {
  md: { text: "text-4xl", lineHeight: 48, image: "lg" },
  lg: { text: "text-5xl", lineHeight: 60, image: "lg" },
  xl: { text: "text-6xl", lineHeight: 72, image: "xl" },
  "2xl": { text: "text-7xl", lineHeight: 84, image: "xl" },
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

    return (
      <Text
        className={cn("font-semibold", textClassName)}
        style={[
          { fontSize: inlineFontSize, lineHeight: resolvedLineHeight },
          textStyle,
        ]}
      >
        {subject.characters ?? "?"}
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

  return (
    <Text
      className={cn(sizeConfig.text, "font-semibold", textClassName)}
      style={[{ lineHeight: lineHeight ?? sizeConfig.lineHeight }, textStyle]}
      numberOfLines={1}
      adjustsFontSizeToFit
      minimumFontScale={0.6}
    >
      {subject.characters ?? "?"}
    </Text>
  )
}
