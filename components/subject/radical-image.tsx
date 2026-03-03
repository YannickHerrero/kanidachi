import * as React from "react"
import { View, Image, ActivityIndicator } from "react-native"
import { SvgUri } from "react-native-svg"
import { Platform } from "react-native"

import { Text } from "@/components/ui/text"
import { cn } from "@/lib/utils"
import type { CharacterImage } from "@/db/schema"

interface RadicalImageProps {
  /** Character images from the subject */
  characterImages: CharacterImage[] | null
  /** Character (if available, used as fallback) */
  characters: string | null
  /** Size of the image/character */
  size?: "sm" | "md" | "lg" | "xl"
  /** Additional className */
  className?: string
  /** Text color for fallback character display */
  textClassName?: string
}

// Size configurations
const SIZES = {
  sm: { container: 32, font: "text-2xl" },
  md: { container: 48, font: "text-4xl" },
  lg: { container: 64, font: "text-5xl" },
  xl: { container: 96, font: "text-6xl" },
} as const

/**
 * Parse character images JSON
 */
export function parseCharacterImages(json: string | null): CharacterImage[] {
  if (!json) return []
  try {
    return JSON.parse(json)
  } catch {
    return []
  }
}

/**
 * Select the best image from available character images
 * Prefers SVG with inline styles; otherwise fall back to PNG
 */
function orderImages(
  images: CharacterImage[],
  options: { preferSvg?: boolean } = {}
): CharacterImage[] {
  if (images.length === 0) return []

  const preferSvg = options.preferSvg ?? true
  const svgWithStyles = images.find(
    (img) => img.contentType === "image/svg+xml" && img.metadata.inlineStyles
  )
  const png = images.find((img) => img.contentType === "image/png")
  const svg = images.find((img) => img.contentType === "image/svg+xml")

  const ordered: CharacterImage[] = []
  const add = (img?: CharacterImage | null) => {
    if (img && !ordered.includes(img)) ordered.push(img)
  }

  if (preferSvg) {
    add(svgWithStyles)
    add(svg)
    add(png)
  } else {
    add(png)
    add(svgWithStyles)
    add(svg)
  }

  for (const img of images) add(img)
  return ordered
}

/**
 * Component to display radical images (for radicals without Unicode characters)
 * Falls back to character text if no image is available
 */
export function RadicalImage({
  characterImages,
  characters,
  size = "md",
  className,
  textClassName,
}: RadicalImageProps) {
  const [isLoading, setIsLoading] = React.useState(true)
  const [error, setError] = React.useState(false)
  const [imageIndex, setImageIndex] = React.useState(0)

  const sizeConfig = SIZES[size]
  const orderedImages = React.useMemo(
    () =>
      orderImages(characterImages ?? [], {
        preferSvg: Platform.OS === "web",
      }),
    [characterImages]
  )
  const selectedImage = orderedImages[imageIndex] ?? null

  React.useEffect(() => {
    setImageIndex(0)
    setError(false)
    setIsLoading(true)
  }, [orderedImages.length])

  // If we have a character, prefer showing it
  if (characters) {
    return (
      <Text className={cn(sizeConfig.font, "font-semibold", textClassName)}>
        {characters}
      </Text>
    )
  }

  // No character and no image - show placeholder
  if (!selectedImage || error) {
    return (
      <View
        className={cn("items-center justify-center", className)}
        style={{ width: sizeConfig.container, height: sizeConfig.container }}
      >
        <Text className={cn(sizeConfig.font, "font-semibold", textClassName)}>
          ?
        </Text>
      </View>
    )
  }

  const isSvg = selectedImage.contentType === "image/svg+xml"

  return (
    <View
      className={cn("items-center justify-center", className)}
      style={{ width: sizeConfig.container, height: sizeConfig.container }}
    >
      {isLoading && (
        <View className="absolute">
          <ActivityIndicator size="small" />
        </View>
      )}

      {isSvg && Platform.OS !== "web" ? (
        // Use SvgUri for native platforms
        <SvgUri
          width={sizeConfig.container}
          height={sizeConfig.container}
          uri={selectedImage.url}
          onLoad={() => setIsLoading(false)}
          onError={() => {
            if (imageIndex + 1 < orderedImages.length) {
              setImageIndex((index) => index + 1)
              setIsLoading(true)
              return
            }
            setIsLoading(false)
            setError(true)
          }}
        />
      ) : (
        // Use Image for PNG or web
        <Image
          source={{ uri: selectedImage.url }}
          style={{
            width: sizeConfig.container,
            height: sizeConfig.container,
          }}
          resizeMode="contain"
          onLoad={() => setIsLoading(false)}
          onError={() => {
            if (imageIndex + 1 < orderedImages.length) {
              setImageIndex((index) => index + 1)
              setIsLoading(true)
              return
            }
            setIsLoading(false)
            setError(true)
          }}
        />
      )}
    </View>
  )
}

/**
 * Inline radical image for use in text or list items
 */
interface InlineRadicalImageProps {
  characterImages: CharacterImage[] | null
  characters: string | null
  size?: number
  className?: string
}

export function InlineRadicalImage({
  characterImages,
  characters,
  size = 24,
  className,
}: InlineRadicalImageProps) {
  const [error, setError] = React.useState(false)
  const [imageIndex, setImageIndex] = React.useState(0)

  const orderedImages = React.useMemo(
    () =>
      orderImages(characterImages ?? [], {
        preferSvg: Platform.OS === "web",
      }),
    [characterImages]
  )
  const selectedImage = orderedImages[imageIndex] ?? null

  React.useEffect(() => {
    setImageIndex(0)
    setError(false)
  }, [orderedImages.length])

  // If we have a character, show it
  if (characters) {
    return (
      <Text className={cn("font-semibold", className)} style={{ fontSize: size * 0.8 }}>
        {characters}
      </Text>
    )
  }

  // No character and no image - show placeholder
  if (!selectedImage || error) {
    return (
      <Text className={cn("font-semibold", className)} style={{ fontSize: size * 0.8 }}>
        ?
      </Text>
    )
  }

  const isSvg = selectedImage.contentType === "image/svg+xml"

  if (isSvg && Platform.OS !== "web") {
    return (
      <SvgUri
        width={size}
        height={size}
        uri={selectedImage.url}
        onError={() => {
          if (imageIndex + 1 < orderedImages.length) {
            setImageIndex((index) => index + 1)
            return
          }
          setError(true)
        }}
      />
    )
  }

  return (
    <Image
      source={{ uri: selectedImage.url }}
      style={{ width: size, height: size }}
      resizeMode="contain"
      onError={() => {
        if (imageIndex + 1 < orderedImages.length) {
          setImageIndex((index) => index + 1)
          return
        }
        setError(true)
      }}
    />
  )
}
