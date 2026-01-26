import * as React from "react"
import { Pressable, View } from "react-native"
import { useRouter } from "expo-router"
import { BarChart3 } from "lucide-react-native"

import { Card, CardContent } from "@/components/ui/card"
import { Text } from "@/components/ui/text"
import { useColorScheme } from "@/lib/useColorScheme"

export function StatsCard() {
  const router = useRouter()
  const { colorScheme } = useColorScheme()

  const handlePress = () => {
    router.push("/stats")
  }

  return (
    <Pressable onPress={handlePress}>
      <Card className="active:opacity-80">
        <CardContent className="flex-row items-center gap-3 p-4">
          <View className="w-10 h-10 rounded-full bg-primary/10 items-center justify-center">
            <BarChart3
              size={20}
              color={colorScheme === "dark" ? "#a78bfa" : "#7c3aed"}
            />
          </View>
          <View className="flex-1">
            <Text className="text-base font-medium text-foreground">
              Statistics
            </Text>
            <Text className="text-sm text-muted-foreground">
              View your progress and accuracy
            </Text>
          </View>
        </CardContent>
      </Card>
    </Pressable>
  )
}
