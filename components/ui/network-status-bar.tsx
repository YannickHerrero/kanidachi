import * as React from "react"
import { View, Animated } from "react-native"
import { WifiOff, Cloud, CloudOff, RefreshCw } from "lucide-react-native"

import { Text } from "@/components/ui/text"
import { cn } from "@/lib/utils"
import { useNetworkStatus } from "@/hooks/useNetworkStatus"
import { getPendingProgressCount } from "@/db/queries"
import { useDatabase } from "@/db/provider"

interface NetworkStatusBarProps {
  className?: string
}

export function NetworkStatusBar({ className }: NetworkStatusBarProps) {
  const { isConnected, isInternetReachable } = useNetworkStatus()
  const isOnline = isConnected && isInternetReachable !== false
  const { db } = useDatabase()
  const [pendingCount, setPendingCount] = React.useState(0)
  const [isVisible, setIsVisible] = React.useState(false)
  const slideAnim = React.useRef(new Animated.Value(-50)).current

  // Check pending count periodically
  React.useEffect(() => {
    if (!db) return

    const checkPending = async () => {
      const count = await getPendingProgressCount(db)
      setPendingCount(count)
    }

    checkPending()
    const interval = setInterval(checkPending, 10000) // Check every 10 seconds

    return () => clearInterval(interval)
  }, [db])

  // Determine if we should show the bar
  React.useEffect(() => {
    const shouldShow = !isOnline || pendingCount > 0
    
    if (shouldShow && !isVisible) {
      setIsVisible(true)
      Animated.spring(slideAnim, {
        toValue: 0,
        useNativeDriver: true,
        tension: 50,
        friction: 8,
      }).start()
    } else if (!shouldShow && isVisible) {
      Animated.spring(slideAnim, {
        toValue: -50,
        useNativeDriver: true,
        tension: 50,
        friction: 8,
      }).start(() => setIsVisible(false))
    }
  }, [isOnline, pendingCount, isVisible, slideAnim])

  if (!isVisible && isOnline && pendingCount === 0) {
    return null
  }

  const getMessage = () => {
    if (!isOnline) {
      return {
        icon: WifiOff,
        text: "You're offline",
        color: "#f97316", // orange
        bgColor: "bg-orange-500/10",
        borderColor: "border-orange-500/20",
      }
    }
    if (pendingCount > 0) {
      return {
        icon: RefreshCw,
        text: `Syncing ${pendingCount} item${pendingCount !== 1 ? "s" : ""}...`,
        color: "#3b82f6", // blue
        bgColor: "bg-blue-500/10",
        borderColor: "border-blue-500/20",
      }
    }
    return null
  }

  const message = getMessage()
  if (!message) return null

  const Icon = message.icon

  return (
    <Animated.View
      style={{
        transform: [{ translateY: slideAnim }],
      }}
      className={cn(
        "absolute top-0 left-0 right-0 z-50",
        className
      )}
    >
      <View
        className={cn(
          "flex-row items-center justify-center gap-2 py-2 px-4",
          message.bgColor,
          "border-b",
          message.borderColor
        )}
      >
        <Icon size={14} color={message.color} />
        <Text className="text-xs font-medium" style={{ color: message.color }}>
          {message.text}
        </Text>
      </View>
    </Animated.View>
  )
}
