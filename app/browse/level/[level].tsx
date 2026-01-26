import * as React from "react"
import { View } from "react-native"
import { SafeAreaView } from "react-native-safe-area-context"
import { useRouter, useLocalSearchParams, Stack } from "expo-router"
import { ChevronLeft, ChevronRight, Search } from "lucide-react-native"

import { Button } from "@/components/ui/button"
import { Text } from "@/components/ui/text"
import { Skeleton } from "@/components/ui/skeleton"
import { SubjectList } from "@/components/browse"
import { useSubjectsByLevel } from "@/hooks/useSubjectsByLevel"
import { useColorScheme } from "@/lib/useColorScheme"

const MAX_LEVEL = 60

export default function BrowseByLevelScreen() {
  const router = useRouter()
  const { colorScheme } = useColorScheme()
  const params = useLocalSearchParams<{ level: string }>()
  const level = Number.parseInt(params.level ?? "1", 10)

  const { grouped, isLoading, error } = useSubjectsByLevel(level)

  const totalCount =
    grouped.radicals.length + grouped.kanji.length + grouped.vocabulary.length

  const handleBack = () => {
    router.back()
  }

  const handleSearchPress = () => {
    router.push("/browse/search")
  }

  const handlePreviousLevel = () => {
    if (level > 1) {
      router.replace(`/browse/level/${level - 1}`)
    }
  }

  const handleNextLevel = () => {
    if (level < MAX_LEVEL) {
      router.replace(`/browse/level/${level + 1}`)
    }
  }

  if (isLoading) {
    return (
      <SafeAreaView className="flex-1 bg-background">
        <Stack.Screen options={{ headerShown: false }} />
        <View className="flex-1 p-4 gap-4">
          {/* Header skeleton */}
          <View className="flex-row items-center gap-2">
            <Skeleton className="h-10 w-10 rounded-full" />
            <Skeleton className="h-6 w-24" />
          </View>
          {/* List skeleton */}
          {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
            <View key={i} className="flex-row items-center gap-3">
              <Skeleton className="w-12 h-12 rounded-lg" />
              <View className="flex-1 gap-1">
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-3 w-16" />
              </View>
              <Skeleton className="h-6 w-16 rounded-full" />
            </View>
          ))}
        </View>
      </SafeAreaView>
    )
  }

  if (error) {
    return (
      <SafeAreaView className="flex-1 bg-background">
        <Stack.Screen options={{ headerShown: false }} />
        <View className="flex-1 items-center justify-center p-4">
          <Text className="text-destructive text-center">{error}</Text>
          <Button onPress={handleBack} className="mt-4">
            <Text>Go Back</Text>
          </Button>
        </View>
      </SafeAreaView>
    )
  }

  const iconColor = colorScheme === "dark" ? "#fff" : "#000"
  const disabledColor = colorScheme === "dark" ? "#4a4a4a" : "#d4d4d4"

  return (
    <SafeAreaView className="flex-1 bg-background" edges={["top"]}>
      <Stack.Screen options={{ headerShown: false }} />

      {/* Header */}
      <View className="flex-row items-center justify-between px-4 py-3 border-b border-border">
        <View className="flex-row items-center gap-2">
          <Button variant="ghost" size="icon" onPress={handleBack}>
            <ChevronLeft size={24} color={iconColor} />
          </Button>
        </View>

        {/* Level navigation */}
        <View className="flex-row items-center gap-2">
          <Button
            variant="ghost"
            size="icon"
            onPress={handlePreviousLevel}
            disabled={level <= 1}
          >
            <ChevronLeft
              size={20}
              color={level <= 1 ? disabledColor : iconColor}
            />
          </Button>

          <Text className="text-lg font-semibold min-w-[80px] text-center">
            Level {level}
          </Text>

          <Button
            variant="ghost"
            size="icon"
            onPress={handleNextLevel}
            disabled={level >= MAX_LEVEL}
          >
            <ChevronRight
              size={20}
              color={level >= MAX_LEVEL ? disabledColor : iconColor}
            />
          </Button>
        </View>

        <Button variant="ghost" size="icon" onPress={handleSearchPress}>
          <Search size={24} color={iconColor} />
        </Button>
      </View>

      {/* Subject count */}
      <View className="px-4 py-2 bg-muted/30 border-b border-border">
        <Text className="text-sm text-muted-foreground">
          {totalCount} subjects
        </Text>
      </View>

      {/* Subject list */}
      <View className="flex-1">
        <SubjectList grouped={grouped} showSrsStage />
      </View>
    </SafeAreaView>
  )
}
