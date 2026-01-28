import * as React from "react"
import { View } from "react-native"
import { AlertCircle, WifiOff, ServerCrash, RefreshCw } from "lucide-react-native"

import { Button } from "@/components/ui/button"
import { Text } from "@/components/ui/text"
import { cn } from "@/lib/utils"
import { useThemeColors } from "@/hooks/useThemeColors"

export type ErrorType = "network" | "server" | "auth" | "generic"

interface ErrorViewProps {
  /** The error message to display */
  message?: string
  /** The type of error (affects icon and default message) */
  type?: ErrorType
  /** Callback to retry the failed operation */
  onRetry?: () => void
  /** Whether a retry is currently in progress */
  isRetrying?: boolean
  /** Additional class names for the container */
  className?: string
  /** Whether to show a compact version */
  compact?: boolean
}

const ERROR_CONFIG = {
  network: {
    icon: WifiOff,
    title: "No Connection",
    defaultMessage: "Unable to connect to the internet. Please check your connection and try again.",
  },
  server: {
    icon: ServerCrash,
    title: "Server Error",
    defaultMessage: "Something went wrong on our end. Please try again later.",
  },
  auth: {
    icon: AlertCircle,
    title: "Authentication Error",
    defaultMessage: "Your session has expired. Please log in again.",
  },
  generic: {
    icon: AlertCircle,
    title: "Error",
    defaultMessage: "Something went wrong. Please try again.",
  },
} as const

export function ErrorView({
  message,
  type = "generic",
  onRetry,
  isRetrying = false,
  className,
  compact = false,
}: ErrorViewProps) {
  const colors = useThemeColors()
  const config = ERROR_CONFIG[type]
  const Icon = config.icon
  const iconColor = colors.destructive

  if (compact) {
    return (
      <View
        className={cn(
          "flex-row items-center gap-3 p-3 rounded-lg bg-destructive/10 border border-destructive/20",
          className
        )}
      >
        <Icon size={20} color={iconColor} />
        <Text className="flex-1 text-sm" style={{color: colors.destructive}} numberOfLines={2}>
          {message ?? config.defaultMessage}
        </Text>
        {onRetry && (
          <Button
            variant="ghost"
            size="sm"
            onPress={onRetry}
            disabled={isRetrying}
          >
            <RefreshCw
              size={16}
              color={iconColor}
              className={isRetrying ? "animate-spin" : ""}
            />
          </Button>
        )}
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
      <View className="w-16 h-16 rounded-full bg-destructive/10 items-center justify-center">
        <Icon size={32} color={iconColor} />
      </View>
      <Text className="text-xl font-semibold">{config.title}</Text>
      <Text className="text-sm text-center max-w-xs" style={{color: colors.mutedForeground}}>
        {message ?? config.defaultMessage}
      </Text>
      {onRetry && (
        <Button
          variant="outline"
          onPress={onRetry}
          disabled={isRetrying}
          className="mt-2"
        >
          <RefreshCw
            size={16}
            color={colors.foreground}
            className={isRetrying ? "animate-spin" : ""}
          />
          <Text className="ml-2">{isRetrying ? "Retrying..." : "Try Again"}</Text>
        </Button>
      )}
    </View>
  )
}
