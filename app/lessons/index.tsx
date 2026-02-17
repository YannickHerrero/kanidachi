import * as React from "react"
import { View, ScrollView } from "react-native"
import { SafeAreaView } from "react-native-safe-area-context"
import { useRouter, Stack } from "expo-router"
import { ChevronLeft } from "lucide-react-native"

import { Button } from "@/components/ui/button"
import { Text } from "@/components/ui/text"
import { Skeleton } from "@/components/ui/skeleton"
import { ErrorView } from "@/components/ui/error-view"
import { EmptyState } from "@/components/ui/empty-state"
import { SubjectGrid, FilterBar } from "@/components/lessons"
import { useAvailableLessons } from "@/hooks/useAvailableLessons"
import { useLessonStore, selectSelectedCount } from "@/stores/lessons"
import { useThemeColors } from "@/hooks/useThemeColors"
import { useSettingsStore } from "@/stores/settings"

export default function LessonPickerScreen() {
  const router = useRouter()
  const colors = useThemeColors()

  const { filteredItems, items, isLoading, error, typeFilter, setTypeFilter, userLevel } =
    useAvailableLessons()

  const {
    selectedSubjectIds,
    toggleSelection,
    selectAll,
    deselectAll,
    setAvailableItems,
    startContent,
  } = useLessonStore()

  const selectedCount = useLessonStore(selectSelectedCount)
  const lessonOrdering = useSettingsStore((s) => s.lessonOrdering)

  // Set available items when loaded
  React.useEffect(() => {
    if (items.length > 0) {
      setAvailableItems(items, lessonOrdering, userLevel ?? undefined)
    }
  }, [items, setAvailableItems, lessonOrdering, userLevel])

  // Calculate filter counts
  const counts = React.useMemo(() => {
    return {
      all: items.length,
      radical: items.filter((i) => i.subject.type === "radical").length,
      kanji: items.filter((i) => i.subject.type === "kanji").length,
      vocabulary: items.filter(
        (i) => i.subject.type === "vocabulary" || i.subject.type === "kana_vocabulary"
      ).length,
    }
  }, [items])

  const handleStartLessons = () => {
    if (selectedCount > 0) {
      startContent(lessonOrdering, userLevel ?? undefined)
      router.push("/lessons/content")
    }
  }

  const handleBack = () => {
    router.back()
  }

  if (isLoading) {
    return (
      <SafeAreaView className="flex-1" style={{ backgroundColor: colors.background }}>
        <Stack.Screen
          options={{
            headerShown: false,
          }}
        />
        <View className="flex-1 p-4 gap-4">
          <View className="flex-row gap-2">
            {[1, 2, 3, 4].map((i) => (
              <Skeleton key={i} className="h-8 w-20 rounded-full" />
            ))}
          </View>
          <View className="flex-row flex-wrap gap-2">
            {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
              <Skeleton key={i} className="w-[23%] aspect-square" />
            ))}
          </View>
        </View>
      </SafeAreaView>
    )
  }

  if (error) {
    const errorType = error.toLowerCase().includes("network") ? "network" : "generic"
    return (
      <SafeAreaView className="flex-1" style={{ backgroundColor: colors.background }}>
        <Stack.Screen options={{ headerShown: false }} />
        <ErrorView
          type={errorType}
          message={error}
          onRetry={handleBack}
        />
      </SafeAreaView>
    )
  }

  if (items.length === 0) {
    return (
      <SafeAreaView className="flex-1" style={{ backgroundColor: colors.background }}>
        <Stack.Screen options={{ headerShown: false }} />
        <EmptyState
          type="lessons"
          actionText="Back to Dashboard"
          onAction={handleBack}
        />
      </SafeAreaView>
    )
  }

  return (
    <SafeAreaView className="flex-1" style={{ backgroundColor: colors.background }} edges={["top"]}>
      <Stack.Screen
        options={{
          headerShown: false,
        }}
      />

      {/* Header */}
      <View className="flex-row items-center justify-between px-4 py-3" style={{ borderBottomWidth: 1, borderBottomColor: colors.border }}>
        <View className="flex-row items-center gap-2">
          <Button variant="ghost" size="icon" onPress={handleBack}>
            <ChevronLeft
              size={24}
              color={colors.foreground}
            />
          </Button>
          <Text className="text-lg font-semibold">
            Lessons ({items.length})
          </Text>
        </View>

        <Button
          onPress={handleStartLessons}
          disabled={selectedCount === 0}
          size="sm"
        >
          <Text style={{ color: colors.primaryForeground }}>
            Start ({selectedCount})
          </Text>
        </Button>
      </View>

      {/* Filter bar */}
      <FilterBar
        selectedFilter={typeFilter}
        onFilterChange={setTypeFilter}
        counts={counts}
      />

      {/* Selection actions */}
      <View className="flex-row gap-2 px-4 py-2">
        <Button variant="outline" size="sm" onPress={selectAll}>
          <Text>Select All</Text>
        </Button>
        <Button variant="outline" size="sm" onPress={deselectAll}>
          <Text>Deselect All</Text>
        </Button>
      </View>

      {/* Subject grid */}
      <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
        <SubjectGrid
          items={filteredItems}
          selectedIds={selectedSubjectIds}
          onToggle={toggleSelection}
        />
      </ScrollView>
    </SafeAreaView>
  )
}
