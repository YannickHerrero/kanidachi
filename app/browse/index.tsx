import * as React from "react"
import { ScrollView, View } from "react-native"
import { SafeAreaView } from "react-native-safe-area-context"
import { useRouter, Stack } from "expo-router"
import { ChevronLeft, Search } from "lucide-react-native"

import { Button } from "@/components/ui/button"
import { Text } from "@/components/ui/text"
import { Skeleton } from "@/components/ui/skeleton"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { LevelGrid } from "@/components/browse"
import { useLevelProgress } from "@/hooks/useLevelProgress"
import { useColorScheme } from "@/lib/useColorScheme"

export default function BrowseHomeScreen() {
  const router = useRouter()
  const { colorScheme } = useColorScheme()
  const { levels, userLevel, maxLevel, isLoading, error } = useLevelProgress()

  const handleBack = () => {
    router.back()
  }

  const handleSearchPress = () => {
    router.push("/browse/search")
  }

  const handleCurrentLevelPress = () => {
    router.push(`/browse/level/${userLevel}`)
  }

  if (isLoading) {
    return (
      <SafeAreaView className="flex-1 bg-background">
        <Stack.Screen options={{ headerShown: false }} />
        <View className="flex-1 p-4 gap-4">
          {/* Header skeleton */}
          <View className="flex-row items-center gap-2">
            <Skeleton className="h-10 w-10 rounded-full" />
            <Skeleton className="h-6 w-32" />
          </View>
          {/* Level grid skeleton */}
          <View className="gap-2">
            {[1, 2, 3, 4, 5].map((row) => (
              <View key={row} className="flex-row gap-2">
                {[1, 2, 3, 4, 5, 6].map((col) => (
                  <Skeleton key={col} className="flex-1 aspect-square" />
                ))}
              </View>
            ))}
          </View>
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

  return (
    <SafeAreaView className="flex-1 bg-background" edges={["top"]}>
      <Stack.Screen options={{ headerShown: false }} />

      {/* Header */}
      <View className="flex-row items-center justify-between px-4 py-3 border-b border-border">
        <View className="flex-row items-center gap-2">
          <Button variant="ghost" size="icon" onPress={handleBack}>
            <ChevronLeft
              size={24}
              color={colorScheme === "dark" ? "#fff" : "#000"}
            />
          </Button>
          <Text className="text-lg font-semibold">Browse</Text>
        </View>

        <Button variant="ghost" size="icon" onPress={handleSearchPress}>
          <Search
            size={24}
            color={colorScheme === "dark" ? "#fff" : "#000"}
          />
        </Button>
      </View>

      <ScrollView
        className="flex-1"
        contentContainerClassName="p-4 gap-4"
        showsVerticalScrollIndicator={false}
      >
        {/* Quick access to current level */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Current Level</CardTitle>
          </CardHeader>
          <CardContent>
            <Button
              onPress={handleCurrentLevelPress}
              className="w-full bg-primary"
            >
              <Text className="text-primary-foreground font-semibold">
                Go to Level {userLevel}
              </Text>
            </Button>
          </CardContent>
        </Card>

        {/* All Levels Grid */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">All Levels</CardTitle>
          </CardHeader>
          <CardContent>
            <LevelGrid
              levels={levels}
              userLevel={userLevel}
              maxLevel={maxLevel}
            />
          </CardContent>
        </Card>

        {/* Bottom padding */}
        <View className="h-4" />
      </ScrollView>
    </SafeAreaView>
  )
}
