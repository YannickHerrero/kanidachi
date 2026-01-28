import * as React from "react"
import { Pressable, StyleSheet, View } from "react-native"
import { useRouter } from "expo-router"
import { BarChart3 } from "lucide-react-native"

import { Card, CardContent } from "@/components/ui/card"
import { Text } from "@/components/ui/text"
import { useThemeColors } from "@/hooks/useThemeColors"

export function StatsCard() {
  const router = useRouter()
  const colors = useThemeColors()
  const isDark = colors.background === '#0a0a0b'

  const handlePress = () => {
    router.push("/stats")
  }

  return (
    <View style={styles.container}>
      <Pressable
        onPress={handlePress}
        style={({ pressed }) => [styles.pressable, pressed && styles.pressed]}
      >
        <Card style={styles.card}>
          <CardContent className="flex-row items-center gap-3 p-4">
            <View
              className="w-10 h-10 rounded-full items-center justify-center"
              style={{
                backgroundColor: isDark
                  ? "rgba(167, 139, 250, 0.18)"
                  : "rgba(124, 58, 237, 0.12)",
              }}
            >
              <BarChart3
                size={20}
                color={isDark ? "#a78bfa" : "#7c3aed"}
              />
            </View>
            <View className="flex-1">
              <Text className="text-base font-medium" style={{ color: colors.foreground }}>
                Statistics
              </Text>
              <Text className="text-sm" style={{ color: colors.mutedForeground }}>
                View your progress and accuracy
              </Text>
            </View>
          </CardContent>
        </Card>
      </Pressable>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  pressable: {
    flex: 1,
  },
  pressed: {
    opacity: 0.85,
  },
  card: {
    flex: 1,
  },
})
