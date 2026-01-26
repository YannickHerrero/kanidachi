import * as React from "react"
import { View } from "react-native"
import {
  BookOpen,
  CheckCircle2,
  Search,
  Inbox,
  type LucideIcon,
} from "lucide-react-native"

import { Button } from "@/components/ui/button"
import { Text } from "@/components/ui/text"
import { cn } from "@/lib/utils"
import { useColorScheme } from "@/lib/useColorScheme"

export type EmptyStateType = "reviews" | "lessons" | "search" | "generic"

interface EmptyStateProps {
  /** The type of empty state (affects icon and default message) */
  type?: EmptyStateType
  /** Custom title (overrides default) */
  title?: string
  /** Custom message (overrides default) */
  message?: string
  /** Custom icon component */
  icon?: LucideIcon
  /** Optional action button text */
  actionText?: string
  /** Optional action button callback */
  onAction?: () => void
  /** Additional class names for the container */
  className?: string
  /** Whether to show a compact version */
  compact?: boolean
}

const EMPTY_STATE_CONFIG = {
  reviews: {
    icon: CheckCircle2,
    title: "No Reviews Available",
    message: "Great job! You've completed all your reviews. New reviews will appear when items are ready for practice.",
    color: "#22c55e", // green
  },
  lessons: {
    icon: BookOpen,
    title: "No Lessons Available",
    message: "You've completed all available lessons. More will unlock as you progress through your current level.",
    color: "#3b82f6", // blue
  },
  search: {
    icon: Search,
    title: "No Results Found",
    message: "Try adjusting your search terms or browse by level instead.",
    color: "#a1a1aa", // gray
  },
  generic: {
    icon: Inbox,
    title: "Nothing Here",
    message: "There's nothing to show at the moment.",
    color: "#a1a1aa", // gray
  },
} as const

export function EmptyState({
  type = "generic",
  title,
  message,
  icon: CustomIcon,
  actionText,
  onAction,
  className,
  compact = false,
}: EmptyStateProps) {
  const { colorScheme } = useColorScheme()
  const config = EMPTY_STATE_CONFIG[type]
  const Icon = CustomIcon ?? config.icon
  const iconColor = config.color

  if (compact) {
    return (
      <View
        className={cn(
          "flex-row items-center gap-3 p-4 rounded-lg bg-muted/30",
          className
        )}
      >
        <Icon size={24} color={iconColor} />
        <View className="flex-1">
          <Text className="text-sm font-medium text-foreground">
            {title ?? config.title}
          </Text>
          <Text className="text-xs text-muted-foreground" numberOfLines={2}>
            {message ?? config.message}
          </Text>
        </View>
      </View>
    )
  }

  return (
    <View
      className={cn(
        "flex-1 items-center justify-center p-6 gap-4",
        className
      )}
    >
      <View
        className="w-20 h-20 rounded-full items-center justify-center"
        style={{ backgroundColor: `${iconColor}15` }}
      >
        <Icon size={40} color={iconColor} />
      </View>
      <Text className="text-xl font-semibold text-foreground text-center">
        {title ?? config.title}
      </Text>
      <Text className="text-sm text-muted-foreground text-center max-w-xs">
        {message ?? config.message}
      </Text>
      {actionText && onAction && (
        <Button variant="outline" onPress={onAction} className="mt-2">
          <Text>{actionText}</Text>
        </Button>
      )}
    </View>
  )
}
