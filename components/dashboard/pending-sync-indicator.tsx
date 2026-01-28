import * as React from "react"
import { Pressable } from "react-native"
import { Cloud, CloudOff, Loader2 } from "lucide-react-native"

import { Text } from "@/components/ui/text"
import { useDatabase } from "@/db/provider"
import { getPendingProgressCount } from "@/db/queries"
import { processQueue } from "@/lib/sync/pending-queue"
import { useNetworkStatus } from "@/hooks/useNetworkStatus"
import { useThemeColors } from "@/hooks/useThemeColors"

/**
 * Shows a banner when there are pending reviews/lessons to sync.
 * Allows manual retry when tapped.
 */
export function PendingSyncIndicator() {
  const { db } = useDatabase()
  const colors = useThemeColors()
  const isDark = colors.background === '#0a0a0b'
  const { isConnected, isInternetReachable } = useNetworkStatus()
  const isOnline = isConnected && isInternetReachable !== false
  const [pendingCount, setPendingCount] = React.useState(0)
  const [isSyncing, setIsSyncing] = React.useState(false)

  // Fetch pending count
  const fetchPendingCount = React.useCallback(async () => {
    if (!db) return
    const count = await getPendingProgressCount(db)
    setPendingCount(count)
  }, [db])

  React.useEffect(() => {
    fetchPendingCount()
    // Poll every 30 seconds
    const interval = setInterval(fetchPendingCount, 30000)
    return () => clearInterval(interval)
  }, [fetchPendingCount])

  const handlePress = async () => {
    if (!db || !isOnline || isSyncing || pendingCount === 0) return

    setIsSyncing(true)
    try {
      await processQueue(db)
      await fetchPendingCount()
    } catch (error) {
      console.error("[PendingSyncIndicator] Sync error:", error)
    } finally {
      setIsSyncing(false)
    }
  }

  if (pendingCount === 0) {
    return null
  }

  const iconColor = isDark ? "#fbbf24" : "#d97706"
  const textColor = isDark ? "#fbbf24" : "#d97706"

  return (
    <Pressable
      onPress={handlePress}
      className="flex-row items-center gap-2 rounded-lg px-3 py-2"
      style={{
        backgroundColor: 'rgba(245, 158, 11, 0.1)',
        borderWidth: 1,
        borderColor: 'rgba(245, 158, 11, 0.3)'
      }}
    >
      {isSyncing ? (
        <Loader2 size={16} color={iconColor} className="animate-spin" />
      ) : isOnline ? (
        <Cloud size={16} color={iconColor} />
      ) : (
        <CloudOff size={16} color={iconColor} />
      )}
      <Text className="text-sm flex-1" style={{ color: textColor }}>
        {isSyncing
          ? "Syncing..."
          : isOnline
            ? `${pendingCount} item${pendingCount > 1 ? "s" : ""} pending sync`
            : `${pendingCount} item${pendingCount > 1 ? "s" : ""} waiting for connection`}
      </Text>
      {isOnline && !isSyncing && (
        <Text className="text-xs" style={{ color: textColor }}>Tap to retry</Text>
      )}
    </Pressable>
  )
}
