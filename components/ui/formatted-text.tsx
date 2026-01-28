import * as React from "react"
import {
  Text as RNText,
  type TextStyle,
  StyleSheet,
  Linking,
  Pressable,
  View,
  type LayoutChangeEvent,
} from "react-native"
import { ChevronDown, ChevronUp } from "lucide-react-native"

import { Text } from "@/components/ui/text"
import {
  parseMnemonic,
  type MnemonicSegment,
  type MnemonicFormat,
} from "@/lib/mnemonic-parser"
import { MNEMONIC_COLORS, type MnemonicColorKey } from "@/lib/constants"
import { useThemeColors } from "@/hooks/useThemeColors"

interface FormattedTextProps {
  /** The text to parse and render with formatting */
  text: string | null | undefined
  /** Additional text styles to apply */
  style?: TextStyle
  /** Maximum number of lines (standard RN text truncation) */
  numberOfLines?: number
  /** Enable expandable behavior with show more/less */
  expandable?: boolean
  /** Number of lines to show when collapsed (default: 3) */
  collapsedLines?: number
}

/**
 * Renders mnemonic text with rich formatting.
 *
 * Supports WaniKani-style markup tags:
 * - <radical>, <kanji>, <vocabulary> - Subject highlighting
 * - <reading> - Reading highlights
 * - <ja>, <jp> - Japanese text
 * - <b>, <em>, <strong> - Bold
 * - <i> - Italic
 * - <a href="..."> - Links (opens in external browser)
 *
 * Also supports bracket syntax: [tag]...[/tag]
 */
export function FormattedText({
  text,
  style,
  numberOfLines,
  expandable = false,
  collapsedLines = 3,
}: FormattedTextProps) {
  const colors = useThemeColors()
  const isDark = colors.background === '#0a0a0b'

  const [expanded, setExpanded] = React.useState(false)
  const [isTruncated, setIsTruncated] = React.useState(false)
  const [fullHeight, setFullHeight] = React.useState(0)
  const [truncatedHeight, setTruncatedHeight] = React.useState(0)

  const segments = parseMnemonic(text)

  // Determine if text is truncated after both heights are measured
  React.useEffect(() => {
    if (expandable && fullHeight > 0 && truncatedHeight > 0) {
      setIsTruncated(fullHeight > truncatedHeight + 2) // Small buffer for rounding
    }
  }, [expandable, fullHeight, truncatedHeight])

  if (segments.length === 0) return null

  const textColor = colors.foreground
  const iconColor = colors.mutedForeground

  // Determine effective number of lines
  const effectiveLines = expandable && !expanded ? collapsedLines : numberOfLines

  // Measure the full text height (hidden)
  const onFullTextLayout = (event: LayoutChangeEvent) => {
    const { height } = event.nativeEvent.layout
    if (fullHeight === 0) {
      setFullHeight(height)
    }
  }

  // Measure the truncated text height
  const onTruncatedTextLayout = (event: LayoutChangeEvent) => {
    const { height } = event.nativeEvent.layout
    if (truncatedHeight === 0) {
      setTruncatedHeight(height)
    }
  }

  const renderSegments = () =>
    segments.map((segment, index) => (
      <FormattedSegment
        key={index}
        segment={segment}
        isDark={isDark}
        textColor={textColor}
      />
    ))

  // Simple rendering without expandable
  if (!expandable) {
    return (
      <RNText
        style={[styles.text, { color: textColor }, style]}
        numberOfLines={numberOfLines}
      >
        {renderSegments()}
      </RNText>
    )
  }

  // Expandable rendering with show more/less
  return (
    <View>
      {/* Hidden text to measure full height */}
      <RNText
        style={[styles.text, { color: textColor }, style, styles.hiddenText]}
        onLayout={onFullTextLayout}
      >
        {renderSegments()}
      </RNText>

      {/* Visible text */}
      <RNText
        style={[styles.text, { color: textColor }, style]}
        numberOfLines={effectiveLines}
        onLayout={!expanded ? onTruncatedTextLayout : undefined}
      >
        {renderSegments()}
      </RNText>

      {/* Show more/less button */}
      {isTruncated && (
        <Pressable
          onPress={() => setExpanded(!expanded)}
          className="flex-row items-center gap-1 mt-2"
        >
          {expanded ? (
            <>
              <ChevronUp size={16} color={iconColor} />
              <Text className="text-sm" style={{color: colors.mutedForeground}}>Show less</Text>
            </>
          ) : (
            <>
              <ChevronDown size={16} color={iconColor} />
              <Text className="text-sm" style={{color: colors.mutedForeground}}>Show more</Text>
            </>
          )}
        </Pressable>
      )}
    </View>
  )
}

interface FormattedSegmentProps {
  segment: MnemonicSegment
  isDark: boolean
  textColor: string
}

/**
 * Renders a single segment with its formatting applied.
 */
function FormattedSegment({ segment, isDark, textColor }: FormattedSegmentProps) {
  const { text, formats, linkUrl } = segment

  // No formatting - plain text
  if (formats.length === 0) {
    return <RNText>{text}</RNText>
  }

  // Build style from formats
  const segmentStyle: TextStyle = {}
  let hasBackground = false

  for (const format of formats) {
    if (format === "bold") {
      segmentStyle.fontWeight = "bold"
    } else if (format === "italic") {
      segmentStyle.fontStyle = "italic"
    } else if (format === "link") {
      segmentStyle.color = "#0093DD"
      segmentStyle.textDecorationLine = "underline"
    } else if (format in MNEMONIC_COLORS) {
      const colors = MNEMONIC_COLORS[format as MnemonicColorKey]
      const scheme = isDark ? colors.dark : colors.light

      if (scheme.foreground !== "inherit") {
        segmentStyle.color = scheme.foreground
      }
      if (scheme.background !== "transparent") {
        segmentStyle.backgroundColor = scheme.background
        hasBackground = true
      }
    }
  }

  // Handle links - make them tappable
  if (formats.includes("link") && linkUrl) {
    return (
      <RNText
        style={[hasBackground && styles.highlight, segmentStyle]}
        onPress={() => Linking.openURL(linkUrl)}
      >
        {text}
      </RNText>
    )
  }

  return (
    <RNText style={[hasBackground && styles.highlight, segmentStyle]}>
      {text}
    </RNText>
  )
}

const styles = StyleSheet.create({
  text: {
    fontSize: 16,
    lineHeight: 24,
  },
  highlight: {
    paddingHorizontal: 4,
    paddingVertical: 1,
    borderRadius: 4,
    overflow: "hidden",
  },
  hiddenText: {
    position: "absolute",
    opacity: 0,
    zIndex: -1,
  },
})
