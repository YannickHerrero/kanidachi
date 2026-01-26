import * as React from "react"
import { View, Pressable, LayoutChangeEvent } from "react-native"
import { ChevronDown, ChevronUp } from "lucide-react-native"

import { Text } from "@/components/ui/text"
import { useColorScheme } from "@/lib/useColorScheme"

interface ExpandableTextProps {
  text: string
  numberOfLines?: number
  className?: string
}

/**
 * A text component that truncates long text and shows a "Show more" button.
 * Clicking the button expands to show the full text.
 */
export function ExpandableText({
  text,
  numberOfLines = 3,
  className = "",
}: ExpandableTextProps) {
  const { colorScheme } = useColorScheme()
  const [expanded, setExpanded] = React.useState(false)
  const [isTruncated, setIsTruncated] = React.useState(false)
  const [fullHeight, setFullHeight] = React.useState(0)
  const [truncatedHeight, setTruncatedHeight] = React.useState(0)

  // Measure the full text height
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
      // Text is truncated if full height would be larger
      // We check this after both measurements
    }
  }

  // Determine if text is truncated after both heights are measured
  React.useEffect(() => {
    if (fullHeight > 0 && truncatedHeight > 0) {
      setIsTruncated(fullHeight > truncatedHeight + 2) // Small buffer for rounding
    }
  }, [fullHeight, truncatedHeight])

  const iconColor = colorScheme === "dark" ? "#9ca3af" : "#6b7280"

  return (
    <View>
      {/* Hidden text to measure full height */}
      <Text
        className={`${className} absolute opacity-0 -z-10`}
        onLayout={onFullTextLayout}
      >
        {text}
      </Text>

      {/* Visible text */}
      <Text
        className={className}
        numberOfLines={expanded ? undefined : numberOfLines}
        onLayout={!expanded ? onTruncatedTextLayout : undefined}
      >
        {text}
      </Text>

      {/* Show more/less button */}
      {isTruncated && (
        <Pressable
          onPress={() => setExpanded(!expanded)}
          className="flex-row items-center gap-1 mt-2"
        >
          {expanded ? (
            <>
              <ChevronUp size={16} color={iconColor} />
              <Text className="text-sm text-muted-foreground">Show less</Text>
            </>
          ) : (
            <>
              <ChevronDown size={16} color={iconColor} />
              <Text className="text-sm text-muted-foreground">Show more</Text>
            </>
          )}
        </Pressable>
      )}
    </View>
  )
}
