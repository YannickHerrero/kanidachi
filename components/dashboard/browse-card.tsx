import * as React from "react"
import { Pressable, View } from "react-native"
import { useRouter } from "expo-router"
import { Search } from "lucide-react-native"

import { Card, CardContent } from "@/components/ui/card"
import { Text } from "@/components/ui/text"
import { useThemeColors } from "@/hooks/useThemeColors"

export function BrowseCard() {
  const router = useRouter()
  const colors = useThemeColors()

  const handlePress = () => {
    router.push("/browse")
  }

  return (
    <Pressable onPress={handlePress}>
      <Card style={{ backgroundColor: colors.card, borderColor: colors.border }}>
        <CardContent className="p-4 flex-row items-center gap-3">
          <View className="w-10 h-10 rounded-lg items-center justify-center" style={{ backgroundColor: colors.muted }}>
            <Search size={20} color={colors.foreground} />
          </View>
          <View className="flex-1">
            <Text className="text-base font-medium" style={{ color: colors.foreground }}>Browse Subjects</Text>
            <Text className="text-sm" style={{ color: colors.mutedForeground }}>
              Explore all radicals, kanji, and vocabulary
            </Text>
          </View>
        </CardContent>
      </Card>
    </Pressable>
  )
}
