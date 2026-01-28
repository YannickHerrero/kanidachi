import * as React from "react"
import { View } from "react-native"
import { SafeAreaView } from "react-native-safe-area-context"
import { useRouter } from "expo-router"

import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { Text } from "@/components/ui/text"
import { H1, Muted } from "@/components/ui/typography"
import { useDatabase } from "@/db/provider"
import { useSyncStore, SYNC_PHASE_LABELS } from "@/stores/sync"
import { needsInitialSync, performInitialSync } from "@/lib/sync/initial-sync"
import { performIncrementalSync } from "@/lib/sync/incremental-sync"
import { useThemeColors } from "@/hooks/useThemeColors"

export default function SyncScreen() {
  const router = useRouter()
  const colors = useThemeColors()
  const { db } = useDatabase()
  const { isSyncing, progress, error, reset } = useSyncStore()
  const [started, setStarted] = React.useState(false)

  React.useEffect(() => {
    if (!db || isSyncing || started) return

    setStarted(true)

    const runSync = async () => {
      const initial = await needsInitialSync(db)
      if (initial) {
        await performInitialSync(db)
      } else {
        await performIncrementalSync(db)
      }
    }

    runSync().catch(() => {
      // errors are handled in the sync store
    })
  }, [db, isSyncing, started])

  React.useEffect(() => {
    if (progress.phase === "complete") {
      router.replace("/")
    }
  }, [progress.phase])

  const percentage =
    progress.total > 0
      ? Math.min(100, Math.round((progress.current / progress.total) * 100))
      : 0

  const handleRetry = () => {
    reset()
    setStarted(false)
  }

  return (
    <SafeAreaView className="flex-1" style={{ backgroundColor: colors.background }}>
      <View className="flex-1 justify-center px-6">
        <View className="items-center mb-10">
          <H1 className="text-center mb-2">Syncing your data</H1>
          <Muted className="text-center text-lg">
            This may take a few minutes on first run
          </Muted>
        </View>

        <View className="gap-4 mb-6">
          <Text className="text-center">
            {SYNC_PHASE_LABELS[progress.phase] ?? "Syncing"}
          </Text>
          <Progress value={percentage} className="h-3" />
          {progress.total > 0 && (
            <Muted className="text-center">
              {progress.current} of {progress.total}
            </Muted>
          )}
          {progress.message ? (
            <Muted className="text-center">{progress.message}</Muted>
          ) : null}
        </View>

        {error && (
          <View className="items-center gap-4">
            <Text className="text-center" style={{ color: colors.destructive }}>{error}</Text>
            <Button onPress={handleRetry}>
              <Text>Try Again</Text>
            </Button>
          </View>
        )}
      </View>
    </SafeAreaView>
  )
}
