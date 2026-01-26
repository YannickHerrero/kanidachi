import * as React from "react"
import { Pressable, View } from "react-native"
import { useRouter } from "expo-router"
import { Search } from "lucide-react-native"

import { Card, CardContent } from "@/components/ui/card"
import { Text } from "@/components/ui/text"
import { useColorScheme } from "@/lib/useColorScheme"

export function BrowseCard() {
  const router = useRouter()
  const { colorScheme } = useColorScheme()

  const handlePress = () => {
    router.push("/browse")
  }

  const iconColor = colorScheme === "dark" ? "#fff" : "#000"

  return (
    <Pressable onPress={handlePress}>
      <Card className="bg-card border-border">
        <CardContent className="p-4 flex-row items-center gap-3">
          <View className="w-10 h-10 rounded-lg bg-muted items-center justify-center">
            <Search size={20} color={iconColor} />
          </View>
          <View className="flex-1">
            <Text className="text-base font-medium">Browse Subjects</Text>
            <Text className="text-sm text-muted-foreground">
              Explore all radicals, kanji, and vocabulary
            </Text>
          </View>
        </CardContent>
      </Card>
    </Pressable>
  )
}
